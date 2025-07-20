---
title: Configuring Microsoft.AI.Extensions with multiple providers
featuredImageUrl: https://weblog.west-wind.com/images/2025/Configuring-Microsoft-AI-Extension-with-multiple-providers/PostBanner.png
abstract: Microsoft.Extensions.AI is the new base library for creating AI clients in an abstracted way. While the library does a great job with the abstraction of the interfaces it works with, the provider interfaces that create the intial abstractions like IChatClient are a lot less user friendly with hard to discover syntax based on extension methods and different syntax for each provider. In this post I review three providers and how to get them instantiated along with a small streaming example to use them.
keywords: Microsoft.Extension.AI,Configuration,Provider
categories: .NET
weblogName: West Wind Web Log
postId: 4880955
permalink: https://weblog.west-wind.com/posts/2025/May/30/Configuring-MicrosoftAIExtension-with-multiple-providers
postDate: 2025-05-30T22:56:33.5062894-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Configuration for Microsoft.AI.Extensions with multiple providers

![Post Banner](PostBanner.jpg)

I just went through a bit of a struggle to find the right ways to instantiate different AI providers for a streaming completions project that I'm working on, and so I thought I'd write a short post to show the required invocations to get various providers loaded.

Why now? Up until now I've been using my own [home brew Http based OpenAI interface](https://github.com/RickStrahl/Westwind.Ai) for making OpenAI calls. It's lightweight, has no heavy dependencies and it's allowed me to keep a simple API interface that has skirted nearly two years of API churn that the Microsoft interfaces have suffered. But the interface is very simple and it only works with transactional chat/completions and Dall-E image generation. The Microsoft APIs handle a lot more than that, and I knew at some point - once the API churn calms down a bit - I would eventually switch to the new libraries.
  
That time came today as I needed to work with streaming completions and so I'm off to try out `Microsoft.AI.Extensions`. In my use case I need to let end users choose their providers and keys so I need to be able to fairly generically use different AI providers - OpenAI, Azure and Ollama for the most part and the extension provide those interfaces.

I expected this to be pretty easy to do, but it turns out it's not quite as simple as I thought. The `Microsoft.AI.Extensions` SDK is relatively new and has gone through a ton of changes, and... because the various provider implementations for OpenAI, Azure and Ollama are still in preview they are still changing and in the churn. Several problems with this: Much of the documentation online is wrong, and if you try to use LLMs for direction or examples, they are **highly** likely to show and build outdated code with outdated libraries.
  
In fact, that's exactly what happened to me. I had Claude build a small sample for me and it used an old version of the libraries. The code worked with a few minor tweaks and some missing dependencies - Great! However, when I tried to update the libraries to the latest stable release everything broke, and there was no obvious way to fix it. All the types and the myriad of extension methods had changed and I spent the next 2 hours hunting around for the right syntax with many bad starts and outdated information from 3 different LLMs and the Microsoft docs. Eventually I found the right place in the documentation, but even so the information was scattered in different places for each of the providers none of it in places where you'd expected it to be.

> Got a message from Stephen Toub earlier, who pointed out - embarrasingly for me - that the ReadMe files of the NuGet packages have the information. That was one place I didn't look.😄 

Regardless, I thought I'd write down how to set up the different providers in one place in this post, if for nothing else that I can easily reference it later.

##AD##

## Accessing ChatClients with Various Providers
So as of today end of May 2025,  here's what's needed to support:

* OpenAI
* Azure OpenAI
* Ollama
* Any other OpenAI client that uses the standard OpenAI protocol

which is essentially the same what I support in my home brew AI engine (with its limited functionality). 

If you use all three providers (and you can remove the relevant dependencies for what you don't use obviously) you need a bunch of libraries:

**NuGet packages:**

```xml
<ItemGroup>
	<PackageReference Include="Microsoft.Extensions.AI" Version="9.5.0" />
	<PackageReference Include="Microsoft.Extensions.AI.OpenAI" Version="9.5.0-preview.1.25265.7" />
	<PackageReference Include="Microsoft.Extensions.AI.Ollama" Version="9.5.0-preview.1.25265.7" />
	<PackageReference Include="Microsoft.Extensions.AI.AzureAIInference" Version="9.5.0-preview.1.25265.7" />
	<PackageReference Include="Azure.AI.OpenAI" Version="2.2.0-beta.4" />
	<PackageReference Include="Azure.Identity" Version="1.14.0" />
	
    <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="9.0.5" />
    
    <!-- unrelated to the AI libraries but probably need this -->
	<PackageReference Include="Microsoft.Extensions.Configuration" Version="9.0.5" />
	<PackageReference Include="Microsoft.Extensions.Configuration.Json" Version="9.0.5" />
	<PackageReference Include="Microsoft.Extensions.Logging" Version="9.0.5" />
</ItemGroup>
```

The biggest pisser in this list - as always - is the `Azure.Identity` library which adds shit-ton of dependencies which you are unlikely to even be using if you're using API keys.

> Note I'm doing this as part of a desktop application, but this works for any application. ASP.NET has an additional package that has builder syntax to add AI libraries to the ASP.NET DI Service collection - that's not covered here.

## Instantiating a Chat Client
The goal with this extension library is that you can use different providers and have a single interface for the actual AI operations like Chat, Completions, Images etc. and the library does a good job with that.
  
However, the first step of setting up the providers - that is a pain in the ass, because each provider has a different setup procedure.

All the examples end up with an `IChatClient` instance which can then be used the same independently of the provider:

```cs
private readonly IChatClient _chatClient;
```

Each of the providers then has their own syntax:

### OpenAI
This one was the trickiest because I didn't find the 'right' documentation. The OpenAI client in these extensions has gone through many preview syntax iterations. LLM generated code was using an old library and while that worked great it completely broke when using the latest release library.

> The most up to date documentation is in the NuGet Readme file!

The following uses the stable `Microsoft.Extensions.AI` and a preview of `Microsoft.Extensions.AI.OpenAI`.

OpenAI typically needs only an API key and model name, but you can also use this library for other providers and provide an endpoint Uri. Since many providers use OpenAI style APIs this driver works for most of them (Except Azure with its 'special' deployment requirements).

```cs
var apiKey = Environment.GetEnvironmentVariable("OPENAI_KEY");
_chatClient = new OpenAIClient(apiKey)
                   .GetChatClient("gpt-4o-mini")
                   .AsIChatClient();
```

### Azure OpenAI
Azure has to make things more difficult of course, because of the way Azure OpenAI has to be self-hosted in your own Azure deployment. These models are hosted as an Azure resource where you basically run your own OpenAI server, rather than using a packaged service provided directly by Microsoft. You essentially set up a custom hosted model and then provide access to your own hosted Azure OpenAI deployment.

Using the Azure provider requires pulling in a whole bunch of extra Azure libraries and you need to specify the Azure site base url, and deployment name in addition to an API key or other Azure credentials.

Here's the code to use set up the Azure provider with an API key:

```csharp
// site is something like https://youraisite.openai.azure.com/
var site = Environment.GetEnvironmentVariable("AZURE_OPENAI_SITE");
apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY");
var deployment =  "gpt-4o-mini";   // deployment name - name it for the model         
_chatClient = new AzureOpenAIClient(
    new Uri(site),
    new ApiKeyCredential(apiKey))              
        .GetChatClient(deployment)
        .AsIChatClient();
```

### Ollama
For accessing local models Ollama is the most common choice. Ollama lets you download and install models from Ollama or Hugging face repositories and then run them locally.

There are two ways you can do this:

* Using the OpenAI Provider shown above
* Using the custom Ollama Provider

#### Using the OpenAI provider
This uses the standard OpenAI provider with a custom endpoint. Since Ollama uses the OpenAI protocol, this works fine. You have to specify the an API key but Ollama ignores it.

```csharp
_chatClient =
      new OpenAIClient(new ApiKeyCredential("ignored"), new OpenAIClientOptions
      {
          Endpoint = new Uri("http://localhost:11434/v1"),
      })
      .GetChatClient("llama3.1")
      .AsIChatClient();
```


### Using the Ollama Provider
You can also use the explicit Ollama provider. The main reason you might want to do this is to avoid accessing features that are not available for Ollama in the OpenAI provider, although that point is moot with the ChatClient. It's more important for things like the Image API which isn't supported by Ollama, but OpenAI does.

The Ollama provider is considerably simpler than the others providing an IChatClient directly:

```cs
_chatClient = new OllamaChatClient("http://localhost:11434","llama3.1");
```

Yeah this is the way I would have expected the other provides to work too.

As much as I wanted to be excited about using Ollama and local models, in my experience local models are too slow to be useful for most things. Other than perhaps for local chat interfaces, anything in an application running locally takes too much horsepower to be useful and even then the online models - even with Http overhead - many times faster than local models. 

Because you can access Ollama with the OpenAI provider, personally I would skip the Ollama library unless Ollama is the only provider you intend to include in your project.

### Other Providers
There are a number of other providers available as well such as an Onyx provider for local file models that load into the application which might provide better performance than Ollama at the cost of higher resource usage by your application.

## Streaming Completions
This is off the topic, but since I'm here:

One of the reasons I'm playing around with this today is because I'm in need of using the streaming API to capture input as it comes in rather than waiting for completion.

In this case text is streaming into a textbox in a WPF application as part of a proof of concept example:

```csharp
private async Task GetAutocompletionSuggestions(string inputText)
{
    _currentRequestCts = new CancellationTokenSource();

    try
    {
        Status.ShowProgress(" Generating suggestions...");
        
        // Clear previous suggestions
        SuggestionsTextBox.Text = "";

        // Prepare the prompt for autocompletion
        var messages = new List<ChatMessage>
        {
            new(ChatRole.System,
                "You are an AI writing assistant. Complete the user's text naturally and helpfully. " +
                "Provide a continuation that flows well with their input. Keep suggestions concise and relevant. Keep it to 30 words or so."),
            new(ChatRole.User, $"Please continue this text: \"{inputText}\"")
        };

        var options = new ChatOptions
        {
            MaxOutputTokens = 150,
            Temperature = 0.7f
        };

        // Stream the response
        var suggestionBuilder = new StringBuilder();

        //var responseText = (await _chatClient.GetResponseAsync(messages)).Text;
        await foreach (var update in _chatClient.GetStreamingResponseAsync(messages, options, _currentRequestCts.Token))
        {
            if (_currentRequestCts.Token.IsCancellationRequested)
                break;

            var content = update.Text;
            suggestionBuilder.Append(content);
            
            if (!string.IsNullOrEmpty(content))
            {
                // Update UI on main thread
                Dispatcher.Invoke(() =>
                {
                    SuggestionsTextBox.Text = suggestionBuilder.ToString();
                    SuggestionsTextBox.ScrollToEnd();
                });
            }
        }

        // Update final status
        Dispatcher.Invoke(() =>
        {
            SuggestionsTextBox.Text = suggestionBuilder.ToString();

            Status.ShowSuccess(" Suggestions complete");
        });
    }
    catch (OperationCanceledException)
    {
        // Request was cancelled, this is expected
        Dispatcher.Invoke(() =>
        {
            Status.ShowError(" Cancelled");
        });
    }
    catch (Exception ex)
    {
        Dispatcher.Invoke(() =>
        {
            SuggestionsTextBox.Text = $"Error: {ex.Message}";
            Status.ShowError("Error occurred")
        });
    }
}
```

Pretty sweet how simple that process is using the async enumeration implementation in the Extension API.

##AD##

## Summary
The AI space is changing so fast that it's hard to keep up with, and the libraries that are being build reflect that with a lot of churn of changing specifications and features. Hopefully the fact that `Microsoft.Extensions.AI` has now a stable release means that these `Abstractions` stay fixed. I suspect that this is the case at least for the base interfaces, and at the Client level these APIs really succeed of making AI tasks easy to integrate across providers.
  
Now we just need to get the providers to get cleaned up and provide some consistency in how they create the shared interfaces...