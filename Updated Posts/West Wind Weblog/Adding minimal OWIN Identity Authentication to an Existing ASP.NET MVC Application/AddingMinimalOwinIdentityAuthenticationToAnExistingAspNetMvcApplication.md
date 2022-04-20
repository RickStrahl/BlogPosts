---
title: Adding minimal OWIN Identity Authentication to an Existing ASP.NET MVC Application
abstract: ASP.NET 4 provides a new Identity Authentication/Authorization framework that's very comprehensive and works reasonably well for new applications. However, if you have existing applications or use  custom user management, it's not very clear how to use just the basic OWIN  Authentication/Authorization layer without the full UserManager and Entity Framework implementation. In this post I describe how to use the bare minimum Identity features to hook up a custom domain model for both local and external logins in an ASP.NET MVC application.
categories: ' ASP.NET,MVC,OWIN'
keywords: OWIN,Identity,Minimal,SignIn,SignOut,Google,Twitter,GitHub
weblogName: West Wind Web Log
postId: 1123302
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/AccountControllerOverview_thumb.png
permalink: https://weblog.west-wind.com/posts/2015/Apr/29/Adding-minimal-OWIN-Identity-Authentication-to-an-Existing-ASPNET-MVC-Application
postDate: 2018-05-28T19:33:21.7555082-10:00
---
# Adding minimal OWIN Identity Authentication to an Existing ASP.NET MVC Application

<small style="color: firebrick">Note: This article applies to **classic .NET Frameworks based ASP.NET MVC applications only**. It **does not work with .NET Core**.</small>

As of ASP.NET 4, ASP.NET provides a fairly useful identity system. If you create a new project and choose an MVC project and choose to add both internal and external authentication, it’s fairly straight forward to get a reasonable identity implementation into your application.

However, if you have an existing application, or if the full Entity Framework based identity structure doesn’t work for you, then the process to hook up a minimal and custom implementation that uses your own domain/business model and classes is not exactly as straightforward. You have to either rip out the pieces you don’t need from an full template install, or add the necessary pieces. In this post I hope I can show you how to do the latter, showing only the pieces that you need.

The process is not necessarily hard – but it’s not very well documented. It’s difficult to find the information necessary to just create the necessary handlers that can deal with linking accounts to external oAuth providers like Google, Facebook, GitHub and so on. So in this post I’ll go over this scenario.

### A Real World Use Case

I’ve come down this path myself over the last weekend as one of my old sites – [CodePaste.net](https://codepaste.net) – required an update to the old OpenID authentication I had running on that site. Codepaste is a pretty old site; in fact it is was the first MVC application I ever built :-). But it’s been running unencumbered for the last 7 years. That is until Google decided to pull the plug on the old OpenId implementation. Promptly I started getting a ton of emails, and decided I had to re-implement the external providers.

The old implementation used [DotNetOpenAuth](https://dotnetopenauth.net/) combined with FormsAuthentication which [I blogged about years ago](https://weblog.west-wind.com/posts/2009/Sep/17/Integrating-OpenID-in-an-ASPNET-MVC-Application-using-DotNetOpenAuth), but DotnetOpenAuth seems to have fallen out of favor over the years, so I decided to bite the bullet and switch over to the newer, built-in OWIN based Identity functionality in ASP.NET 4.

When you first start looking at Identity the amount of information out there is rather overwhelming. Lots of intro articles that talk about how to use the stuff ‘as is’ without customization. But there’s not a lot of information on using the core Identity pieces _without_ the full bore UserManager and Entity Framework data store, in order to use just the Authentication/Authorization on their own and integrate them with my own business objects/domain model.

#### Just the Core Identity Features for Local and External Logins

The goal of this post is to show the minimal pieces of the OWIN Identity system to handle Local and External account logins and hook them to a custom domain model rather than using the Entity Framework based UserManager. In short focus on the system components that manage authentication and leave the user management to the application.

### Just Show me what I need!

The main text of this article is lengthy as it covers the CodePaste.NET login and user management features relevant to the discussion in addition to the core login features. For those of you that want just the nuts and bolts there’s also a summary section at the end that shows just the relevant code in skeleton format that you can just plug into your controllers. I’ve also linked to the full source code of the Account Controller I discuss here if you want to see the full code, rather than bite-sized snippets.

*   [**Minimal Code Summary**](#MinimalCodeSummary)
*   [**Full AccountController Source Code on Github**](https://github.com/RickStrahl/CodePaste.NET/blob/master/CodePasteMvc/Controllers/AccountController.cs)

For more detail… read on.

### OWIN based Identity in ASP.NET MVC 5

If you haven’t used the new Identity features in ASP.NET MVC 5 at all, I suggest that you check it out first by creating a new MVC Web site and letting it create a default Web site with Individual User Authentication enabled. This will let you see how the default implementation works. If you’re looking at code specific implementation details you can check out the AccountController and ManageController which deal with the user management interfaces. AccountController deals with logging in for both local and external accounts, while ManageController deals with setting up new accounts, email confirmations etc. This is part of the reason why Identity feels pretty overwhelming – when you look at the code there’s a ton of stuff going on and it’s all tightly intermixed with the specific Entity Framework based implementation.

Nevertheless I encourage you to at least take a brief glance at it, maybe stepping through to understand the overall flow of how logins are processed.

### Extracting just the necessary Pieces

In order to use the OWIN Idenity pieces in your own application that doesn’t use the EF based UserManager, you’ll have to do a few things. Again, my goal as part of this article is to:

*   Support Cookie based User Logins (username/password)
*   Support External Logins (Google, Github, Twitter)
*   Support ability to create Accounts using both local or external Accounts
*   Support logging in with either local or external accounts

In order to accomplish this with an existing application I have to:

*   Turn off IIS Authentication for the Application
*   Add the appropriate NuGet Packages
*   Implement the Account Registration for Local and External Accounts
*   Implement Logging in for Local and External Accounts
*   Allow for signing in using the OWIN based Login mechanism

Let’s take a look and see what each of these steps look like.

### Turn off IIS Authentication for the Application

ASP.NET Identity works using the OWIN platform which is a custom subsystem that doesn’t rely on standard IIS security. Because OWIN can be self hosted there’s no dependency on IIS in this system. On IIS OWIN plugs into the IIS pipeline using a few dynamically inject modules but it essentially completely takes over the Authentication/Authorization process for your application. So, in order to use ASP.NET Identity the first thing you have to do is actually turn off standard IIS authentication in web.config for your application.

```xml
<system.web>   
    <authentication mode="None" />   
<system.web>
```

I did not do this initially and it took me a while to figure why my application kept throwing up browser authentication dialogs instead of navigating to my login page or sending me off to an external provider login. Make sure standard authentication is off!

### Adding NuGet Packages

If you have an existing project that doesn’t have any identity features installed you’ll need to get the right assemblies into your project. If you look at a newly created MVC project and the litany of assemblies in there it’s not obvious what’s actually required to get **just** the basic features.

Luckily, thanks to the power of NuGet, to get just the core identity features you can add just the following  packages to get all the references you needed for the core identity features plus a few of the external providers needed.

*   Microsoft.Owin.Host.SystemWeb
*   Microsoft.Owin.Security.Cookies

The first two packages are enough to light up the OWIN identity framework. If you’re not running on IIS use Microsoft.Owin.Host.SelfHost instead of the SystemWeb host.

You’ll also need to install the the specific external provider packages:

*   Microsoft.Owin.Security.Google
*   Microsoft.Owin.Security.Twitter
*   Owin.Security.Providers

The provider packages add support for specific external providers you can log in with. The [**Owin.Security.Providers**](https://github.com/RockstarLabs/OwinOAuthProviders) **package** is a third party library that includes a ton of additional providers you can integrate with and that’s what I used to support GitHub logins, since this is a developer focused site.

### Startup Class: Provider Configuration

The next step is to configure OWIN pipeline to actually handle the various login solutions. To do so you have to create a Startup class that configures the various authentication mechanisms. In my case I support Local user authentication (Cookie Auth) as well as external providers for Google, Twitter and GitHub.

Here’s the config code:

```cs
namespace CodePasteMvc
{   
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }

        // For more information on configuring authentication, please visit http://go.microsoft.com/fwlink/?LinkId=301864
        public void ConfigureAuth(IAppBuilder app)
        {
            // Enable the application to use a cookie to store information for the signed in user
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = DefaultAuthenticationTypes.ApplicationCookie,
                LoginPath = new PathString("/Account/LogOn")
            });


            app.UseExternalSignInCookie(DefaultAuthenticationTypes.ExternalCookie);
            
            // App.Secrets is application specific and holds values in CodePasteKeys.json
            // Values are NOT included in repro – auto-created on first load
            if (!string.IsNullOrEmpty(App.Secrets.GoogleClientId))
            {
                app.UseGoogleAuthentication(                
                    clientId: App.Secrets.GoogleClientId,
                    clientSecret: App.Secrets.GoogleClientSecret);
            }

            if (!string.IsNullOrEmpty(App.Secrets.TwitterConsumerKey))
            {
                app.UseTwitterAuthentication(
                    consumerKey: App.Secrets.TwitterConsumerKey,
                    consumerSecret: App.Secrets.TwitterConsumerSecret);
            }

            if (!string.IsNullOrEmpty(App.Secrets.GitHubClientId))
            {
                app.UseGitHubAuthentication(
                    clientId: App.Secrets.GitHubClientId,
                    clientSecret: App.Secrets.GitHubClientSecret);
            }

            AntiForgeryConfig.UniqueClaimTypeIdentifier = ClaimTypes.NameIdentifier;
        }
    }
}
```

This is an implementation of an OWIN startup class. When the OWIN runtime fires up, it looks via Reflection for a class named **Startup** class with a **Configuration(IAppBuilder app)** method and when it finds it executes that method.

**ConfigureAuth()** then configures Cookie Authentication for local logins and the external providers for Google, Twitter and Github.  I use a **custom** ApplicationConfiguration class to hold my secret values in a JSON file using my [ApplicationConfiguration class](https://github.com/RickStrahl/Westwind.ApplicationConfiguration) (mainly to keep them out of the the GitHub repo), but you can either hardcode these values or read them from a configuration setting.

Each provider requires what amounts to an application ID and a secret key that you have to configure. In order to use external providers you have to create an application for each at the providers Developer Web site  and then pick up the keys these applications generate. Here are links to each of those (assumes you’re logged in to each site):

*   [Google Developer Console](https://console.developers.google.com/project)
*   [GitHub Application Settings](https://github.com/settings/applications)
*   [Twitter Application Management](https://apps.twitter.com/app/new "https://apps.twitter.com/app/new")

Note that you can pick and choose your providers. You can use only Cookie authentication, or only externals or both in combination as I’m doing on this site.

### Customizing the AccountController

All of the code I’ll be discussing in relation to these logins is located in an MVC controller – specifically the AccountController. There are really 3 main set of features that need to implemented – local logins, external logins and the actual sign in/out operations. Here’s roughly what this looks like in AccountController class:

[![AccountControllerOverview](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/AccountControllerOverview_thumb.png "AccountControllerOverview")](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/AccountControllerOverview_2.png)

There are also a few more traditional Controller actions that deal with some of the supporting feature of my implementation – password recovery and account activation specifically. This is my entire implementation, so as you can see it’s considerably simpler – and less featured – than the full (overkill?) Identity implementation you get in a default full features MVC site which is perfect for this post.

### Signing in and Out

I’m going to start with signing in and out first, because it’s a core feature that will be used by all the the others operations. A user is signed in whenever either a local or external login succeeds, and this process essentially creates the authentication Cookie that identifies the user and allows the Identity framework to figure out whether the user is already logged in and setup the User Principal object for each request.

If you’ve used **FormsAuthentication** in ASP.NET you know that there’s a global object that handles management of the user tracking cookie that associates a user with an account. OWIN has its own version of an authentication manager in the [**IAuthenticationManager interface**](https://msdn.microsoft.com/en-us/library/microsoft.owin.security.iauthenticationmanager%28v=vs.113%29.aspx) which is attached to the HttpContext object. To get a reference to it you can use:

```csharp
HttpContext.GetOwinContext().Authentication;
```

This object handles creation and deleting of the secure cookie that is used to track the user through the site. The identity cookie is used to track all logged in users, regardless of whether they logged in locally with a username and password or using an external provider like Google. Once a user is authenticated, the SignIn method is called to create the cookie. On subsequent requests, OWIN based Identity subsystem then picks up the Cookie and authorizes the user the appropriate IPrinciple (a **ClaimsPrinciple** with a **ClaimsIdentity**) based User whenever the user accesses your site.

##AD##

Identity sign-ins work with [ClaimsIdentity](https://msdn.microsoft.com/en-us/library/system.security.claims.claimsidentity%28v=vs.110%29.aspx) objects, which contains user information stored in claims. The claims provide the user ID and names and any other information you want to store with the authenticated user as cached state.

To simplify sign-in I use a couple of helper functions that look like this:

```cs
public void IdentitySignin(AppUserState appUserState, string providerKey = null, bool isPersistent = false)
{
    var claims = new List<Claim>();

    // create required claims
    claims.Add(new Claim(ClaimTypes.NameIdentifier, appUserState.UserId));
    claims.Add(new Claim(ClaimTypes.Name, appUserState.Name));

    // custom – my serialized AppUserState object
    claims.Add(new Claim("userState", appUserState.ToString()));

    var identity = new ClaimsIdentity(claims, DefaultAuthenticationTypes.ApplicationCookie);

    AuthenticationManager.SignIn(new AuthenticationProperties()
    {
        AllowRefresh = true,
        IsPersistent = isPersistent,
        ExpiresUtc = DateTime.UtcNow.AddDays(7)
    }, identity);
}

public void IdentitySignout()
{
    AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie,
                                    DefaultAuthenticationTypes.ExternalCookie);
}

private IAuthenticationManager AuthenticationManager
{
    get { return HttpContext.GetOwinContext().Authentication; }
}
```

### SignIn/SignOut

The key methods are **SignIn()** and **SignOut()** on the **AuthenticationManager**, which create or delete the application cookies on the executing request. SignIn() takes an Identity object that includes any claims you have assigned to it. This identity is what you also get back once the user is logged in and you look at **Context.User.Identity** later to check for authorization.

### A Word about AppUserState

Note I’m using an application specific **[AppUserState](https://github.com/RickStrahl/CodePaste.NET/blob/master/CodePasteMvc/Classes/AppUserState.cs)** class to represent the logged in user’s state which is then added to the Identity’s claims! This is a **custom** object in **my** application that basically holds basic User that are the bare minimum needed by the application to display user info like name, admin status, theme etc. This object is persisted and cached inside of the **ClaimsIdentity claims** and therefore in the cookie, so that the data is available without having to look up a user in the database for each request.

Above I show how the AppUserState is persisted in the identity cookie. For retrieval and storage in a property on the controller,  I have a base controller that has an internal AppUserState property that is loaded up from a valid ClaimsPrincipal when a request comes in in **BaseController.Initialize()**:

```csharp
protected override void Initialize(RequestContext requestContext)
{
    base.Initialize(requestContext);

    // Grab the user's login information from Identity
    AppUserState appUserState = new AppUserState();
    if (User is ClaimsPrincipal)
    {
        var user = User as ClaimsPrincipal;
        var claims = user.Claims.ToList();

        var userStateString = GetClaim(claims, "userState");
        //var name = GetClaim(claims, ClaimTypes.Name);
        //var id = GetClaim(claims, ClaimTypes.NameIdentifier);

        if (!string.IsNullOrEmpty(userStateString))
            appUserState.FromString(userStateString);
    }
    AppUserState = appUserState;
            
    ViewData["UserState"] = AppUserState;
    ViewData["ErrorDisplay"] = ErrorDisplay;
}
```

The net effect is that anywhere within Controller and most Views this AppUserState object is available for user info display or visual display options.

This approach made great sense when I was using FormsAuthentication because you could effectively only store a single string value which was the serialized AppUserState value. But now ClaimsIdentity can contain multiple values as claims explicitly as a dictionary so it may be much cleaner to simply store any values as claims on the ClaimsIdentity. In the future the AppUserState code could probably be abstracted away, using a custom ClaimsIdentity instead that knows how to persist and retrieve its state from the attached claims instead. I’ll leave that exercise for another day though because AppUserState is used widely in this application.

Either way I want to make it clear that **[AppUserState](https://github.com/RickStrahl/CodePaste.NET/blob/master/CodePasteMvc/Classes/AppUserState.cs)** is a **custom implementation** and an application specific implementation detail for my application.

### Local Logins using Cookies

There are two steps for each login type: Creating the user and account initially, and then actually logging in the user. So lets start with the registration process for local logins.

Here’s what the User Registration form looks like:

[![RegistrationForm](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/RegistrationForm_thumb.png "RegistrationForm")](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/RegistrationForm_2.png)

The top of the form holds the local login, while the bottom has the external provider logins. From this form you can choose to sign up with an external login, which fills the local user registration form with any data that might be received from the external provider. Google provides the email address, GitHub both email and name, and Twitter provides only the name for example. In either case a new user is created in the application.

The code that responds to the **Register** button essentially creates a new account (if there are no validation errors), and signs the user in.

Here’s what the local user login code looks like (keep in mind this application specific):

```csharp
AcceptVerbs(HttpVerbs.Post)]
[ValidateAntiForgeryToken]
public ActionResult Register(FormCollection formVars)
{
    string id = formVars["Id"];
    string confirmPassword = formVars["confirmPassword"];

    bool isNew = false;
    User user = null;
    if (string.IsNullOrEmpty(id) || busUser.Load(id) == null)
    {
        user = busUser.NewEntity();
        user.InActive = true;
        isNew = true;
    }
    else
        user = busUser.Entity;
            
    UpdateModel<User>(busUser.Entity,
        new string[] { "Name", "Email", "Password", "Theme" });
            
    if (ModelState.Count > 0)
        ErrorDisplay.AddMessages(ModelState);


    if (ErrorDisplay.DisplayErrors.Count > 0)
        return View("Register", ViewModel);

    if (!busUser.Validate())
    {
        ErrorDisplay.Message = "Please correct the following:";
        ErrorDisplay.AddMessages(busUser.ValidationErrors);
        return View("Register", ViewModel);
    }

    if (!busUser.Save())
    {
        ErrorDisplay.ShowError("Unable to save User: " + busUser.ErrorMessage);
        return View("Register", ViewModel);
    }

    AppUserState appUserState = new AppUserState();
    appUserState.FromUser(user);
    IdentitySignin(appUserState, appUserState.UserId);            

    if (isNew)
    {
        SetAccountForEmailValidation();
        ErrorDisplay.HtmlEncodeMessage = false;
        ErrorDisplay.ShowMessage(@"Thank you for creating an account...");
        return View("Register", ViewModel);
    }


    return RedirectToAction("New","Snippet");
}
```

This code really isn’t very different from how we used to do it previously. You check to see if the saved is a user we already have in the system and if so update her, or else create a new one and update the new user instead.

The key item here that is different is simply that I set the **AppUserState** as described before and then create call **IdentitySignIn()** to authenticate that user. On subsequent hits I then get a Context.User with the ClaimsIdentity for that user.

### Logging in a Local Account

Once an account is registered you can actually log in. Here’s what the login form looks like:

[![LogInform](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/LogInform_thumb.png "LogInform")](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/LogInform_2.png)

The code to handle the login looks like this:

```csharp
[AcceptVerbs(HttpVerbs.Post)]
public ActionResult LogOn(string email, string password, bool rememberMe, string returnUrl, bool emailPassword)
{
    if (emailPassword)
        return EmailPassword(email);

    var user = busUser.ValidateUserAndLoad(email, password);
    if (user == null)
    {
        ErrorDisplay.ShowError(busUser.ErrorMessage);
        return View(ViewModel);
    }

    AppUserState appUserState = new AppUserState()
    {
        Email = user.Email,
        Name = user.Name,
        UserId = user.Id,
        Theme = user.Theme,
        IsAdmin = user.IsAdmin
    };
    IdentitySignin(appUserState, user.OpenId, rememberMe);

    if (!string.IsNullOrEmpty(returnUrl))
        return Redirect(returnUrl);

    return RedirectToAction("New", "Snippet", null);
}
```

Again as you may guess, the code here simply looks up the username and password and if valid, updates the **AppUserState** object and then calls **IdentitySignin()** to log the user in.

Both of these workflows are not different at all from what I used to do with FormsAuthentication. The only real difference is that I’m calling  **IdentitySignin()** instead of **FormsAuthentication.Authenticate()**.

Now on to the fun stuff that you couldn’t easily do before – external logins.

### Linking to an External Login

As you can see in the screen shots above both the registration and login forms support using external providers to handle authentication of an account. For the registration form the external login can either be performed at the beginning of registration to pre-fill the registration information from the external provider, or by attaching the external login to an existing local account.

For external logins, when you click any of the provider buttons you are redirected to the provider site (Google, Twitter, GitHub), which checks whether your account is logged in. If it isn’t you’re shuttled to the providers log in page on their server where you can log in and/or specify what kind of rights you want to give to the application that is requesting the login (ie. my site). After you click accept, the server fires a callback request on your server and provides the Claims that the provider makes available. Typically this is a provider key (an identifier for your user’s login) as well as either name or email or both.

##AD##

External logins are handled via an OAuth2 flow that is managed internally by the OWIN authentication pipeline in ASP.NET. When the requests are fired off they include a callback url which fires first into the OWIN handler. The callback URL is /signin-google or /signin-twitter or /signin-github.

Both creation of an initial account link between a local account and the external account as well as logging has a two endpoint request flow: One to actually start the remote authentication process via a Challenge operation (which is a Redirect really), and one to receive the callback when the authentication is complete.

Here’s the first method that initiates the Linking of an External Account by Challenging and Redirecting to the provider:

```csharp
[AllowAnonymous]
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<ActionResult> ExternalLinkLogin(string provider)
{
    // Request a redirect to the external login provider to link a login for the current user
    return new ChallengeResult(provider, Url.Action("ExternalLinkLoginCallback"), AppUserState.UserId);
}
```

ChallengeResult is a helper class that is part of the stock ASP.NET MVC default controller implementation from which I simply copied it:

```csharp
private const string XsrfKey = "CodePaste_$31!.2*#";

public class ChallengeResult : HttpUnauthorizedResult
{
    public ChallengeResult(string provider, string redirectUri)
        : this(provider, redirectUri, null)
    { }

    public ChallengeResult(string provider, string redirectUri, string userId)
    {
        LoginProvider = provider;
        RedirectUri = redirectUri;
        UserId = userId;
    }

    public string LoginProvider { get; set; }
    public string RedirectUri { get; set; }
    public string UserId { get; set; }

    public override void ExecuteResult(ControllerContext context)
    {
        var properties = new AuthenticationProperties { RedirectUri = RedirectUri };
        if (UserId != null)
            properties.Dictionary[XsrfKey] = UserId;
                
        var owin = context.HttpContext.GetOwinContext();
        owin.Authentication.Challenge(properties, LoginProvider);
    }
}
```

The key of this class is the OWIN **Authentication.Challenge()** method which issues a **302 Redirect** to the provider to handle the login with a URL that includes the Redirect URL and some state information. The state in this case is an a user identifier (our user id in this case) that lets us check and make sure the result is the one we’re interested in when it comes back.

When the provider has validated (or failed to validate) the user, it makes  callback to your server using a specific URL. The URL that is called back to is ~/signin-google or ~/signin-github or ~/signin-twitter for example. The OWIN pipeline internally handles this callback for you and after it has validated redirects to your actual endpoint so you can handle the authenticated request.

To illustrate check out this Fiddler trace of a Registration Link request, when already logged into my Google account:

[![FiddlerRegistration](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/FiddlerRegistration_thumb.png "FiddlerRegistration")](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/FiddlerRegistration_2.png)

Notice all the **302** requests. The first request is initiated by your code using the ChallengeResult which redirects to Google. Google then redirects back to the OWIN internal endpoint to handle the provider OAuth parsing and finally the OWIN pipeline calls into your code with ExternalLinkLoginCallback().

Here’s the Callback method that is called when the Link process is complete:

```csharp
[AllowAnonymous]
[HttpGet]
public async Task<ActionResult> ExternalLinkLoginCallback()
{
    // Handle external Login Callback
    var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync(XsrfKey, AppUserState.UserId);
    if (loginInfo == null)
    {
        IdentitySignout(); // to be safe we log out
        return RedirectToAction("Register", new {message = "Unable to authenticate with external login."});
    }

    // Authenticated!
    string providerKey = loginInfo.Login.ProviderKey;
    string providerName = loginInfo.Login.LoginProvider;

    // Now load, create or update our custom user

    // normalize email and username if available
    if (string.IsNullOrEmpty(AppUserState.Email))
        AppUserState.Email = loginInfo.Email;
    if (string.IsNullOrEmpty(AppUserState.Name))
        AppUserState.Name = loginInfo.DefaultUserName;

    var userBus = new busUser();
    User user = null;

    if (!string.IsNullOrEmpty(AppUserState.UserId))
        user = userBus.Load(AppUserState.UserId);

    if (user == null && !string.IsNullOrEmpty(providerKey))
        user = userBus.LoadUserByProviderKey(providerKey);

    if (user == null && !string.IsNullOrEmpty(loginInfo.Email))
        user = userBus.LoadUserByEmail(loginInfo.Email);

    if (user == null)
    {
        user = userBus.NewEntity();
        userBus.SetUserForEmailValidation(user);
    }

    if (string.IsNullOrEmpty(user.Email))
        user.Email = AppUserState.Email;

    if (string.IsNullOrEmpty(user.Name))
        user.Name = AppUserState.Name ?? "Unknown (" + providerName + ")";


    if (loginInfo.Login != null)
    {
        user.OpenIdClaim = loginInfo.Login.ProviderKey;
        user.OpenId = loginInfo.Login.LoginProvider;
    }
    else
    {
        user.OpenId = null;
        user.OpenIdClaim = null;
    }

    // finally save user inf
    bool result = userBus.Save(user);

    // update the actual identity cookie
    AppUserState.FromUser(user);
    IdentitySignin(AppUserState, loginInfo.Login.ProviderKey);

    return RedirectToAction("Register");
}
```

There’s a fair bit of code in this snippet, but… most of the code is application specific. The most important piece of the code is the first line that is responsible for returning the LoginInfo object that contains the providerKey and any other claims that the provider makes available. Typically those are a name and/or email. The rest of the code then checks to see if the user already exists and updates it or if not creates a new one and saves it. If all goes where IdenitySignin() is called to effectively log the user in by creating the cookie and authorized ClaimsIdentity on subsequent requests.

When done the user is logged in, but I want to re-display the Registration form to show the external account registration:

[![LinkedAccountDisplay](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/LinkedAccountDisplay_thumb_1.png "LinkedAccountDisplay")](https://weblog.west-wind.com/images/2015Windows-Live-Writer/Adding-oAuth-Authent.NET-MVC-Application_CC2E/LinkedAccountDisplay_4.png)

### Logging in with an External Login

Finally we still have to hook up the logic to log in with an external provider. As with the Linking of the provider, this is a two step process – fire off the initial authentication request. As with the link operation a challenge request handles this:

```csharp
[HttpPost]
[AllowAnonymous]
[ValidateAntiForgeryToken]
public ActionResult ExternalLogin(string provider)
{
    string returnUrl = Url.Action("New","Snippet",null);            
    return new ChallengeResult(provider, Url.Action("ExternalLoginCallback",
                               "Account", new { ReturnUrl = returnUrl }));
}
```

Again the same **302** requests are issued to eventually bring back the result into the OWIN pipeline which in turn redirects to the **ExternalLoginCallback()** method:

```csharp
[AllowAnonymous]
public async Task<ActionResult> ExternalLoginCallback(string returnUrl)
{
    var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
    if (loginInfo == null)
        return RedirectToAction("LogOn");

    // AUTHENTICATED!
    var providerKey = loginInfo.Login.ProviderKey;


    // Aplication specific code goes here.
    var userBus = new busUser();
    var user = userBus.ValidateUserWithExternalLogin(providerKey);
    if (user == null)
    {
        return RedirectToAction("LogOn", new
        {
            message = "Unable to log in with " + loginInfo.Login.LoginProvider +
                        ". " + userBus.ErrorMessage
        });
    }

    // store on AppUser
    AppUserState appUserState = new AppUserState();
    appUserState.FromUser(user);
    IdentitySignin(appUserState, providerKey, isPersistent: true);

    return Redirect(returnUrl);
}
```

The process is similar  to the link operation in the previous example except the login code simply checks to see if the user is valid and if so logs him in using the now familiar IdentySignin() method. 

The user is logged in at this point so simply redirect where we want to go.

#### Unlink an Account

Finally if you want to unlink the account, all I have to do is remove the link in the domain model. In my case I remove the field values for OpenId and OpenIdClaim, so that any subsequent login using an external account will fail as we won’t match the provider key provided by the external provider.

Here’s the code for the unlink operation:

```cs
[HttpPost]
[ValidateAntiForgeryToken]
public ActionResult ExternalUnlinkLogin()
{
    var userId = AppUserState.UserId;
    var user = busUser.Load(userId);
    if (user == null)
    {
        ErrorDisplay.ShowError("Couldn't find associated User: " + busUser.ErrorMessage);
        return RedirectToAction("Register", new { id = userId });
    }
    user.OpenId = string.Empty;
    user.OpenIdClaim = string.Empty;

    if (busUser.Save())
        return RedirectToAction("Register", new { id = userId });

    return RedirectToAction("Register", new { message = "Unable to unlink OpenId. " + busUser.ErrorMessage });
}
```

After this code executes, the external account link is gone. I show the register page again and this time the external link account is no longer shown replaced again by the three external providers one of which can be hooked up.

And that’s all the base operations!

### A quick Review

You may think that that’s a lot of code you have to write for something that should be pretty simple. But keep in mind that this code includes some application specific logic that I provided here in order to provide a somewhat realistic context. While the actual underlying Identity code is pretty small (and I’ve highlighted the core requirements in the snippets in bold), the code shown here is probably the bare minimum you need for a basic self managed user management implementation you probably want to run in a real application.

If you want to see the complete controller code you can check it out on Github.

In summary you basically deal with:

**IdentitySignIn**, **IdentitySignOut** for standard LogIn/LogOut functions

Implementing **ExternalLinkLogin()** and **ExternalLinkLoginCallback()**

Implementing **ExternalLogin()** and **ExternalLoginCallback()**

The various ExternalXXXX methods follow a simple boilerplate of using **ChallengeResult** for the initial request and calling **GetExternalLoginInfoAsync()** to pick up the result data. It’s really fairly straight forward as long as you know the pieces you actually need to implement.

##AD##

### Minimal Code Summary

Because the code above is quite lengthy, here’s a summary of just the relevant parts you have to implement with just the basic pieces:

#### Startup Configuration Class

```cs
public partial class Startup
{
    public void Configuration(IAppBuilder app)
    {
        ConfigureAuth(app);
    }

    // For more information on configuring authentication, please visit http://go.microsoft.com/fwlink/?LinkId=301864
    public void ConfigureAuth(IAppBuilder app)
    {
        app.UseExternalSignInCookie(DefaultAuthenticationTypes.ExternalCookie);

        // Enable the application to use a cookie to store information for the signed in user
        app.UseCookieAuthentication(new CookieAuthenticationOptions
        {
            AuthenticationType = DefaultAuthenticationTypes.ApplicationCookie,
            LoginPath = new PathString("/Account/LogOn")
        });
            
        // these values are stored in CodePasteKeys.json
        // and are NOT included in repro - autocreated on first load
        if (!string.IsNullOrEmpty(App.Secrets.GoogleClientId))
        {
            app.UseGoogleAuthentication(                
                clientId: App.Secrets.GoogleClientId,
                clientSecret: App.Secrets.GoogleClientSecret);
        }

        if (!string.IsNullOrEmpty(App.Secrets.TwitterConsumerKey))
        {
            app.UseTwitterAuthentication(
                consumerKey: App.Secrets.TwitterConsumerKey,
                consumerSecret: App.Secrets.TwitterConsumerSecret);
        }

        if (!string.IsNullOrEmpty(App.Secrets.GitHubClientId))
        {
            app.UseGitHubAuthentication(
                clientId: App.Secrets.GitHubClientId,
                clientSecret: App.Secrets.GitHubClientSecret);
        }

        AntiForgeryConfig.UniqueClaimTypeIdentifier = ClaimTypes.NameIdentifier;
    }
}
```

#### IdentitySignIn/SignOut

```cs
public void IdentitySignin(string userId, string name, string providerKey = null, bool isPersistent = false)
{
    var claims = new List<Claim>();

    // create *required* claims
    claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
    claims.Add(new Claim(ClaimTypes.Name, name));

    var identity = new ClaimsIdentity(claims, DefaultAuthenticationTypes.ApplicationCookie);

    // add to user here!
    AuthenticationManager.SignIn(new AuthenticationProperties()
    {
        AllowRefresh = true,
        IsPersistent = isPersistent,
        ExpiresUtc = DateTime.UtcNow.AddDays(7)
    }, identity);
}

public void IdentitySignout()
{
    AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie,
                                  DefaultAuthenticationTypes.ExternalCookie);
}

private IAuthenticationManager AuthenticationManager
{
    get
    {
        return HttpContext.GetOwinContext().Authentication;
    }
}
```

#### External Link Login
```cs
[AllowAnonymous]
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<ActionResult> ExternalLinkLogin(string provider) //Google,Twitter etc.
{
    return new ChallengeResult(provider, Url.Action("ExternalLinkLoginCallback"), userId);
}

[AllowAnonymous]
[HttpGet]        
public async Task<ActionResult> ExternalLinkLoginCallback()
{
    // Handle external Login Callback
    var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync(XsrfKey,userId);
    if (loginInfo == null)
    {
        IdentitySignout(); // to be safe we log out
        return RedirectToAction("Register", new {message = "Unable to authenticate with external login."});
    }

    // Authenticated!
    string providerKey = loginInfo.Login.ProviderKey;
    string providerName = loginInfo.Login.LoginProvider;


    // Your code here…


    
    // when all good make sure to sign in user
    IdentitySignin(userId, name, providerKey, isPersistent: true);


    return RedirectToAction("Register");
}     
```

This code and the External Login also require the ChallengeResult helper class:

```cs
// Used for XSRF protection when adding external logins
private const string XsrfKey = "CodePaste_$31!.2*#";

public class ChallengeResult : HttpUnauthorizedResult
{
    public ChallengeResult(string provider, string redirectUri)
        : this(provider, redirectUri, null)
    {  }

    public ChallengeResult(string provider, string redirectUri, string userId)
    {
        LoginProvider = provider;
        RedirectUri = redirectUri;
        UserId = userId;
    }

    public string LoginProvider { get; set; }
    public string RedirectUri { get; set; }
    public string UserId { get; set; }

    public override void ExecuteResult(ControllerContext context)
    {
        var properties = new AuthenticationProperties { RedirectUri = RedirectUri };
        if (UserId != null)
            properties.Dictionary[XsrfKey] = UserId;
                
        var owin = context.HttpContext.GetOwinContext();
        owin.Authentication.Challenge(properties, LoginProvider);
    }
}
```

#### External Login

```cs
[HttpPost]
[AllowAnonymous]
[ValidateAntiForgeryToken]
public ActionResult ExternalLogin(string provider)
{
    string returnUrl = Url.Action("New","Snippet",null);            
    return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", 
                               "Account", new { ReturnUrl = returnUrl }));
}
        
[AllowAnonymous]
public async Task<ActionResult> ExternalLoginCallback(string returnUrl)
{                        
    if ( string.IsNullOrEmpty(returnUrl) )
        returnUrl = "~/";
            
    var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
    if (loginInfo == null)
        return RedirectToAction("LogOn");

    // AUTHENTICATED!
    var providerKey = loginInfo.Login.ProviderKey;

    // Your code goes here.

    // when all good make sure to sign in user
    IdentitySignin(userId, name, providerKey, isPersistent: true);

    return Redirect(returnUrl);
}
```

#### Local Account Registration

```cs
[AcceptVerbs(HttpVerbs.Post)]
[ValidateAntiForgeryToken]
public ActionResult Register(FormCollection formVars)
{

    // Capture User Data and Create/Update account
     
    // when all good make sure to sign in user
    IdentitySignin(userId, name, appUserState.UserId);            

    return RedirectToAction("New","Snippet",null);
}cs

```

#### Local Account Login

```cs
[AcceptVerbs(HttpVerbs.Post)]
public ActionResult LogOn(string email, string password, bool rememberMe, string returnUrl, bool emailPassword)
{
    // validate your user 
    
    // if all OK sign in
    IdentitySignin(userId, name, user.OpenId, rememberMe);

    return RedirectToAction("New", "Snippet", null);
}

public ActionResult LogOff()
{
    IdentitySignout();
    return RedirectToAction("LogOn");
}
```

### Summary

For new projects it’s probably a good idea to think long and hard whether you want to roll your own, or just stick with the stock Identity implementation. Personally I’m not a fan of the EF based implementation that comes out of the box. While it can be customized you still have to massively tweak the UI to make things fit with your application and probably add and remove fields from the Identity models. Worst of all though is the default EF dependency that doesn’t easily integrate into even another EF model. Personally, I prefer to have user management integrated as part of my own domain models of the application rather than linking users to customers for example.

The other advantage of using your own is that you’re not stuck to Microsoft’s whims. We’ve gone through too many authentication frameworks with Microsoft seemingly changing the model with every major release cycle. Granted the new Identity is probably the closest thing that they ever had that is actually usable out of the box, but I’m still wary to rely on anything that Microsoft sticks in the box in this regard for fear of getting it yanked out from under me in the next version. Using my own I don’t have to worry about at least the user management features that can travel with my applications. With my own implementation I might have a little more setup to do, but at least I have a standard way that I can easily carry forward through applications of any version of ASP.NET.

In the end I have to say that although it took me quite a while to get my head around EXACTLY what I needed to implement, was not very difficult. The hard part was just finding the right information on what you need to implement by digging into the generate code and ripping out the relevant pieces. Once you know what’s needed the implementation of the actual code pieces is relatively straight forward.

I hope that this post provides a good summary of what’s required and especially with the Minimal Code Summary it’ll be easier to create the skeleton code required to plug your own domain driven user management into the core identity framework.

### Resources

*   [**CodePaste.NET Project on GitHub**](https://github.com/RickStrahl/CodePaste.NET)