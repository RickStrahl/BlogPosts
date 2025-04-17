---
title: WCF WS-Security and WSE Nonce Authentication
abstract: I ran into a Web Service last week that required WS-Security headers with an embedded nonce value. Unfortunately WCF doesn't support this particular protocol directly. Here's how to create custom credentials and a tokenizer to write out the customized WS-Security header.
keywords: WS-Security,WSE,Nonce,Digest
categories: WCF,Web Services
weblogName: West Wind Web Log
postId: 1532939
postDate: 2018-05-10T11:59:51.3516013-07:00
---
# WCF WS-Security and WSE Nonce Authentication

WCF makes it fairly easy to access WS-* Web Services, except when you run into a service format that it doesn't support. Even then WCF provides a huge amount of flexibility to make the service clients work, however finding the proper interfaces to make that happen is not easy to discover and for the most part undocumented unless you're lucky enough to run into a blog, forum or StackOverflow post on the matter.

This is definitely true for the Password Nonce as part of the WS-Security/WSE protocol, which is not natively supported in WCF. Specifically I had a need to create a WCF message on the client that includes a WS-Security header that looks like this from their spec document:

```xml
<soapenv:Header>
  <wsse:Security soapenv:mustUnderstand="1"
      xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <wsse:UsernameToken wsu:Id="UsernameToken-8"
      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:Username>TeStUsErNaMe1</wsse:Username>
      <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"                  >TeStPaSsWoRd1</wsse:Password>
      <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"                  >f8nUe3YupTU5ISdCy3X9Gg==</wsse:Nonce>
      <wsu:Created>2011-05-04T19:01:40.981Z</wsu:Created>
    </wsse:UsernameToken>
  </wsse:Security>
</soapenv:Header>
```


Specifically, the _Nonce_ and _Created_ keys are what WCF doesn't create or have a built in formatting for.

Why is there a nonce? My first thought here was WTF? The username and password are there in clear text, what does the Nonce accomplish? The Nonce and created keys are are part of [WSE Security specification](http://www.reliablesoftware.com/articles/WSESecurity.html) and are meant to allow the server to detect and prevent replay attacks. The hashed nonce should be unique per request which the server can store and check for before running another request thus ensuring that a request is not replayed with exactly the same values.

### Basic ServiceUtl Import - not much Luck

The first thing I did when I imported this service with a service reference was to simply import it as a Service Reference. The Add Service Reference import automatically detects that WS-Security is required and appropariately adds the WS-Security to the basicHttpBinding in the config file:

<?xml version="1.0" encoding="utf-8" ?>
<configuration>
    <system.serviceModel>
        <bindings>
            <basicHttpBinding>
                <binding name="RealTimeOnlineSoapBinding">
                    <security mode="Transport" />
                </binding>
                <binding name="RealTimeOnlineSoapBinding1" />
            </basicHttpBinding>
        </bindings>
        <client>
            <endpoint address="https://notarealurl.com:443/services/RealTimeOnline"
                binding="basicHttpBinding" bindingConfiguration="RealTimeOnlineSoapBinding"
                contract="RealTimeOnline.RealTimeOnline" name="RealTimeOnline" />
        </client>
    </system.serviceModel>
</configuration>

If if I run this as is using code like this:

```csharp
var client = new RealTimeOnlineClient();

client.ClientCredentials.UserName.UserName = "TheUsername";
client.ClientCredentials.UserName.Password = "ThePassword";
```
I get **nothing** in terms of WS-Security headers. The request is sent, but the the binding expects transport level security to be applied, rather than message level security. To fix this so that a WS-Security message header is sent the security mode can be changed to:

```xml
<security mode="TransportWithMessageCredential" />
```

Now if I re-run I at least get a WS-Security header which looks like this:

```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
            xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <s:Header>
    <o:Security s:mustUnderstand="1"
                xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <u:Timestamp u:Id="_0">
        <u:Created>2012-11-24T02:55:18.011Z</u:Created>
        <u:Expires>2012-11-24T03:00:18.011Z</u:Expires>
      </u:Timestamp>
      <o:UsernameToken u:Id="uuid-18c215d4-1106-40a5-8dd1-c81fdddf19d3-1">
        <o:Username>TheUserName</o:Username>
        <o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"
                   >ThePassword</o:Password>
      </o:UsernameToken>
    </o:Security>
  </s:Header>
```

Closer! Now the WS-Security header is there along with a timestamp field (which might not be accepted by some WS-Security expecting services), but there's no Nonce or created timestamp as required by my original service.

### Using a CustomBinding instead

My next try was to go with a CustomBinding instead of basicHttpBinding as it allows a bit more control over the protocol and transport configurations for the binding. Specifically I can explicitly specify the message protocol(s) used. Using configuration file settings here's what the config file looks like:

```xml
<?xml version="1.0"?>
<configuration>
  <system.serviceModel>
    <bindings>
      <customBinding>
        <binding name="CustomSoapBinding">
          <security includeTimestamp="false"
                    authenticationMode="UserNameOverTransport"
                    defaultAlgorithmSuite="Basic256"
                    requireDerivedKeys="false"
                    messageSecurityVersion="WSSecurity10WSTrustFebruary2005WSSecureConversationFebruary2005WSSecurityPolicy11BasicSecurityProfile10">
          </security>
          <textMessageEncoding messageVersion="Soap11"></textMessageEncoding>
          <httpsTransport maxReceivedMessageSize="2000000000"/>
        </binding>
      </customBinding>
    </bindings>
    <client>
      <endpoint address="https://notrealurl.com:443/services/RealTimeOnline"
                binding="customBinding"
                bindingConfiguration="CustomSoapBinding"
                contract="RealTimeOnline.RealTimeOnline"
                name="RealTimeOnline" />
    </client>
  </system.serviceModel>
  <startup>
    <supportedRuntime version="v4.0"
                      sku=".NETFramework,Version=v4.0"/>
  </startup>
</configuration>
```


This ends up creating a cleaner header that's missing the timestamp field which can cause some services problems. The WS-Security header output generated with the above looks like this:

```xml
<s:Header>
  <o:Security s:mustUnderstand="1"
              xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <o:UsernameToken u:Id="uuid-291622ca-4c11-460f-9886-ac1c78813b24-1">
      <o:Username>TheUsername</o:Username>
      <o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"                 >ThePassword</o:Password>
    </o:UsernameToken>
  </o:Security>
</s:Header>
```

This is closer as it includes only the username and password.

The key here is the protocol for WS-Security:

```
messageSecurityVersion="WSSecurity10WSTrustFebruary2005WSSecureConversationFebruary2005WSSecurityPolicy11BasicSecurityProfile10"
```

Quite the mouthful, eh?

This explicitly specifies the protocol version. There are several variants of this specification but none of them seem to support the nonce unfortunately. This protocol does allow for optional omission of the Nonce and created timestamp provided (which effectively makes those keys optional). With some services I tried that requested a Nonce just using this protocol actually worked where the default basicHttpBinding failed to connect, so this is a possible solution for access to some services.

Unfortunately for my target service that was not an option. The nonce has to be there.

### Creating Custom ClientCredentials

As it turns out WCF doesn't have support for the Digest Nonce as part of WS-Security, and so as far as I can tell there's no way to do it just with configuration settings. I did a bunch of research on this trying to find workarounds for this, and I did find a couple of entries on StackOverflow as well as on the MSDN forums. However, none of these are particularily clear and I ended up using bits and pieces of several of them to arrive at a working solution in the end.

*   [http://stackoverflow.com/questions/896901/wcf-adding-nonce-to-usernametoken](http://stackoverflow.com/questions/896901/wcf-adding-nonce-to-usernametoken "http://stackoverflow.com/questions/896901/wcf-adding-nonce-to-usernametoken")
*   [http://social.msdn.microsoft.com/Forums/en-US/wcf/thread/4df3354f-0627-42d9-b5fb-6e880b60f8ee](http://social.msdn.microsoft.com/Forums/en-US/wcf/thread/4df3354f-0627-42d9-b5fb-6e880b60f8ee "http://social.msdn.microsoft.com/Forums/en-US/wcf/thread/4df3354f-0627-42d9-b5fb-6e880b60f8ee")

The latter forum message is the more useful of the two (the last message on the thread in particular) and it has most of the information required to make this work. But it took some experimentation for me to get this right so I'll recount the process here maybe a bit more comprehensively.

In order for this to work a number of classes have to be overridden:

*   ClientCredentials
*   ClientCredentialsSecurityTokenManager
*   WSSecurityTokenizer

The idea is that we need to create a custom ClientCredential class to hold the custom properties so they can be set from the UI or via configuration settings. The TokenManager and Tokenizer are mainly required to allow the custom credentials class to flow through the WCF pipeline and eventually provide custom serialization.

Here are the three classes required and their full implementations:

```cs
public class CustomCredentials : ClientCredentials
{
    public CustomCredentials()
    { }

    protected CustomCredentials(CustomCredentials cc)
        : base(cc)
    { }

    public override System.IdentityModel.Selectors.SecurityTokenManager CreateSecurityTokenManager()
    {
        return new CustomSecurityTokenManager(this);
    }

    protected override ClientCredentials CloneCore()
    {
        return new CustomCredentials(this);
    }
}

public class CustomSecurityTokenManager : ClientCredentialsSecurityTokenManager
{
    public CustomSecurityTokenManager(CustomCredentials cred)
        : base(cred)
    { }

    public override System.IdentityModel.Selectors.SecurityTokenSerializer CreateSecurityTokenSerializer(System.IdentityModel.Selectors.SecurityTokenVersion version)
    {
        return new CustomTokenSerializer(System.ServiceModel.Security.SecurityVersion.WSSecurity11);
    }
}

public class CustomTokenSerializer : WSSecurityTokenSerializer
{
    public CustomTokenSerializer(SecurityVersion sv)
        : base(sv)
    { }

    protected override void WriteTokenCore(System.Xml.XmlWriter writer,
                                            System.IdentityModel.Tokens.SecurityToken token)
    {
        UserNameSecurityToken userToken = token as UserNameSecurityToken;

        string tokennamespace = "o";

        DateTime created = DateTime.Now;
        string createdStr = created.ToString("yyyy-MM-ddThh:mm:ss.fffZ");

        // unique Nonce value - encode with SHA-1 for 'randomness'
        // in theory the nonce could just be the GUID by itself
        string phrase = Guid.NewGuid().ToString();
        var nonce = GetSHA1String(phrase);

        // in this case password is plain text
        // for digest mode password needs to be encoded as:
        // PasswordAsDigest = Base64(SHA-1(Nonce + Created + Password))
        // and profile needs to change to
        //string password = GetSHA1String(nonce + createdStr + userToken.Password);

        string password = userToken.Password;

        writer.WriteRaw(string.Format(
        "<{0}:UsernameToken u:Id=\"" + token.Id +
        "\" xmlns:u=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\">" +
        "<{0}:Username>" + userToken.UserName + "</{0}:Username>" +
        "<{0}:Password Type=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText\">" +
        password + "</{0}:Password>" +
        "<{0}:Nonce EncodingType=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary\">" +
        nonce + "</{0}:Nonce>" +
        "<u:Created>" + createdStr + "</u:Created></{0}:UsernameToken>", tokennamespace));
    }

    protected string GetSHA1String(string phrase)
    {
        SHA1CryptoServiceProvider sha1Hasher = new SHA1CryptoServiceProvider();
        byte[] hashedDataBytes = sha1Hasher.ComputeHash(Encoding.UTF8.GetBytes(phrase));
        return Convert.ToBase64String(hashedDataBytes);
    }

}
```


Realistically only the CustomTokenSerializer has any significant code in. The code there deals with actually serializing the custom credentials using low level XML semantics by writing output into an XML writer.

I can't take credit for this code - most of the code comes [from the MSDN forum post](http://social.msdn.microsoft.com/Forums/en-US/wcf/thread/4df3354f-0627-42d9-b5fb-6e880b60f8ee) mentioned earlier - I made a few adjustments to simplify the nonce generation and also added some notes to allow for PasswordDigest generation.

Per spec the nonce is nothing more than a unique value that's supposed to be 'random'. I'm thinking that this value can be any string that's unique and a GUID on its own probably would have sufficed. Comments on other posts that GUIDs can be potentially guessed are highly exaggerated to say the least IMHO. To satisfy even that aspect though I added the SHA1 encryption and binary decoding to give a more random value that would be impossible to 'guess'. The original example from the forum post used another level of encoding and decoding to string in between - but that really didn't accomplish anything but extra overhead.

The header output generated from this looks like this:

```xml
<s:Header>
  <o:Security s:mustUnderstand="1"
              xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <o:UsernameToken u:Id="uuid-f43d8b0d-0ebb-482e-998d-f544401a3c91-1"
                      xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <o:Username>TheUsername</o:Username>
      <o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">ThePassword</o:Password>
      <o:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"
                     >PjVE24TC6HtdAnsf3U9c5WMsECY=</o:Nonce>
      <u:Created>2012-11-23T07:10:04.670Z</u:Created>
    </o:UsernameToken>
  </o:Security>
</s:Header>
```
which is exactly as it should be.

### Password Digest?

In my case the password is passed in plain text over an SSL connection, so there's no digest required so I was done with the code above.

Since I don't have a service handy that requires a password digest,  I had no way of testing the code for the digest implementation, but here is how this is likely to work. If you need to pass a digest encoded password things are a little bit trickier. The password type namespace needs to change to:

[http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#Digest](http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#Digest "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText")

and then the password value needs to be encoded. The format for password digest encoding is this:

**Base64(SHA-1(Nonce + Created + Password))**

and it can be handled in the code above with this code (that's commented in the snippet above):

```cs
string password = GetSHA1String(nonce + createdStr + userToken.Password);
```

The entire WriteTokenCore method for digest code looks like this:

```csharp
protected override void WriteTokenCore(System.Xml.XmlWriter writer,
                                        System.IdentityModel.Tokens.SecurityToken token)
{
    UserNameSecurityToken userToken = token as UserNameSecurityToken;

    string tokennamespace = "o";

    DateTime created = DateTime.Now;
    string createdStr = created.ToString("yyyy-MM-ddThh:mm:ss.fffZ");

    // unique Nonce value - encode with SHA-1 for 'randomness'
    // in theory the nonce could just be the GUID by itself
    string phrase = Guid.NewGuid().ToString();
    var nonce = GetSHA1String(phrase);

    string password = GetSHA1String(nonce + createdStr + userToken.Password);

    writer.WriteRaw(string.Format(
    "<{0}:UsernameToken u:Id=\"" + token.Id +
    "\" xmlns:u=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\">" +
    "<{0}:Username>" + userToken.UserName + "</{0}:Username>" +
    "<{0}:Password Type=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#Digest\">" +
    password + "</{0}:Password>" +
    "<{0}:Nonce EncodingType=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary\">" +
    nonce + "</{0}:Nonce>" +
    "<u:Created>" + createdStr + "</u:Created></{0}:UsernameToken>", tokennamespace));        
}
```
I had no service to connect to to try out Digest auth - if you end up needing it and get it to work please drop a comment…

### How to use the custom Credentials

The easiest way to use the custom credentials is to create the client in code.

Here's a factory method I use to create an instance of my service client: 

```csharp
public static RealTimeOnlineClient CreateRealTimeOnlineProxy(string url,
                                                                string username,
                                                                string password)
{
    if (string.IsNullOrEmpty(url))
        url = "https://notrealurl.com:443/cows/services/RealTimeOnline";
            
    CustomBinding binding = new CustomBinding();  

    var security = TransportSecurityBindingElement.CreateUserNameOverTransportBindingElement();
    security.IncludeTimestamp = false;
    security.DefaultAlgorithmSuite = SecurityAlgorithmSuite.Basic256;
    security.MessageSecurityVersion = MessageSecurityVersion.WSSecurity10WSTrustFebruary2005WSSecureConversationFebruary2005WSSecurityPolicy11BasicSecurityProfile10;

    var encoding = new TextMessageEncodingBindingElement();
    encoding.MessageVersion = MessageVersion.Soap11;

    var transport = new HttpsTransportBindingElement();
    transport.MaxReceivedMessageSize = 20000000; // 20 megs

    binding.Elements.Add(security);
    binding.Elements.Add(encoding);
    binding.Elements.Add(transport);

    RealTimeOnlineClient client = new RealTimeOnlineClient(binding,
        new EndpointAddress(url));

    // to use full client credential with Nonce uncomment this code:
    // it looks like this might not be required - the service seems to work without it
    client.ChannelFactory.Endpoint.Behaviors.Remove<System.ServiceModel.Description.ClientCredentials>();
    client.ChannelFactory.Endpoint.Behaviors.Add(new CustomCredentials());

    client.ClientCredentials.UserName.UserName = username;
    client.ClientCredentials.UserName.Password = password;

    return client;
}
```

This returns a service client that's ready to call other service methods.

The key item in this code is the ChannelFactory endpoint behavior modification that that first removes the original ClientCredentials and then adds the new one. The ClientCredentials property on the client is read only and this is the way it has to be added.

### Summary

It's a bummer that WCF doesn't suport WSE Security authentication with nonce values out of the box. From reading the comments in posts/articles while I was trying to find a solution, I found that this feature was omitted by design as this protocol is considered unsecure. While I agree that plain text passwords are rarely a good idea even if they go over secured SSL connection as WSE Security does, there are unfortunately quite a few services (mosly Java services I suspect) that use this protocol. I've run into this twice now and trying to find a solution online I can see that this is not an isolated problem - many others seem to have struggled with this. It seems there are about a dozen questions about this on StackOverflow all with varying incomplete answers. Hopefully this post provides a little more coherent content in one place.

Again I marvel at WCF and its breadth of support for protocol features it has in a single tool. And even when it can't handle something there are ways to get it working via extensibility. But at the same time I marvel at how freaking difficult it is to arrive at these solutions. I mean there's no way I could have ever figured this out on my own. It takes somebody working on the WCF team or at least being very, very intricately involved in the innards of WCF to figure out the interconnection of the various objects to do this from scratch. Luckily this is an older problem that has been discussed extensively online and I was able to cobble together a solution from the online content. I'm glad it worked out that way, but it feels dirty and incomplete in that there's a whole learning path that was omitted to get here…

Man am I glad I'm not dealing with SOAP services much anymore. REST service security - even when using some sort of federation is a piece of cake by comparison :-) I'm sure once standards bodies gets involved we'll be right back in security standard hell…