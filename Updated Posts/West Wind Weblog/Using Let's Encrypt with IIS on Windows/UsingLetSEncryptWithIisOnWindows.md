---
title: Using Let's Encrypt with IIS on Windows
abstract: Let's Encrypt is a new, open source certificate authority for creating free SSL certificates. In this post I show you how you can use some of the API clients on Windows to create Let's Encrypt certificates for use in IIS.
keywords: LetsEncrypt,IIS,Powershell,ACMESharp
categories: IIS,Security,LetsEncrypt
weblogName: West Wind Web Log
postId: 1503593
postDate: 2018-05-28T22:39:09.5648496-07:00
---
# Using Let's Encrypt with IIS on Windows

[Let's Encrypt](https://letsencrypt.org/) is a new open source certificate authority that promises to provide free SSL certificates in a standardized, API accessible and non-commercial way. If you've installed SSL certificates in the past, you're probably familiar with the process of signing up for a certificate with some paid for provider and then going through the manual process of swapping certificate requests and completed requests.

Let's Encrypt is based on set of open service APIs that can be implemented on any platform and create certificates for Web servers including IIS. This seems like a fabulous idea, given that securing your site if you have any sort of authenticated access is an absolute requirement. It's not so much the money that's a problem since basic SSL certificates these days even from paid providers are relatively cheap (I use [DnSimple](https://dnsimple.com/ssl-certificates) both for domain management and SSL certificates), but the fact that you can completely automate the process of SSL creation and management is a huge win. This has both upsides and downsides actually and I'll talk about that at the end of the article. To be clear – I'm not a network admin and I don't have extensive experience managing certificates on a large number of sites so in this post I cover a few basic scenarios that I deal with in my own sites hosted on my own hosted servers.

### Windows and IIS – not a first class citizen

I've followed the development of Let's Encrypt with interest, but there wasn't much to try initially as there was no implementation directly available for Windows. Last week I ran into [Nik Molnar's post](https://gooroo.io/GoorooTHINK/Article/16420/Lets-Encrypt-Azure-Web-Apps-the-Free-and-Easy-Way/20047#.VsrRtZwrLAQ) that points at some of the tools available for Windows using PowerShell, the Command Line and even the startings of a Windows UI based tool. Nik then goes on to describe an Azure plug-in implementation that can automatically register and renew Let's Encrypt certificates.

However I was more interested in the IIS pieces rather than Azure as I don't use Azure and  host on IIS, so over the weekend I took these tools for a spin to see what's really involved in getting Let's Encrypt to work with my IIS sites. This posts is a summary of what I found.\

##AD##

### What's available on Windows

As is often the case with open tools, Windows is always the afterthought rather than the norm when it comes to open networking and security tools. So when Let's Encrypt initially went to beta there was no Windows support. However, now that it's been in beta for a while there are a few tools available that provide wrappers for the Automated Certificate Management Environment (ACME) API.

There are a number of options available:

*   **[LetsEncrypt-Win-Simple](https://github.com/Lone-Coder/letsencrypt-win-simple)**  
Currently this seems like the easiest solution to getting new Certificates installed into IIS quickly and easily. This Windows Command Line utility includes an 'interactive' mode that lets you pick a host headered Web site on your server and will go out and create the certificate and install it into IIS in one seamless operation. This works great for manual installation or simple scripted installs. It's quick and easy and by far the easiest solution I tried so far.

*   **[ACMESharp Powershell Commands](https://github.com/ebekker/ACMESharp)**  
ACMESharp is a Powershell library that provides access to many (but not yet all) commands of the ACME API. Unlike the Win-Simple approach using the ACMESharp library requires a bit of scripting you have to write yourself with some logic, but you get a lot of control over the process and the ability to create and save the intermediate certificates.\

*   **[Certify](http://certify.webprofusion.com/)**  
This is a GUI implementation of the ACME API that promises to provide interactive ACME certificate management. Currently this tool is pretty rough, but improvements are coming and each new version seems to improve significantly. It's a great way to visually see certificates and obviously much easier for those that don't want to futz around with lots of command line foo.

To be clear, all of these tools are in very early release stages and so they are a bit rough with features missing… and that's to be expected. This stuff is new. Let's Encrypt itself is in beta and these tools build ontop of that base stack. But nevertheless I was able to use all of these tools  to work to register certificates so you can get started today using Let's Encrypt on your own IIS Web sites.

What's missing in all tools currently is administration. You can't revoke or remove certificates and there's no way to clear out certificates on the remote servers. While testing I ended up hitting a limit of certificates registered on one of my sites and then couldn't go further with that site as I can't remove/revoke any of the certs. Natch.

Because of this, I recommend if you plan to play with these tools, create a new host headered test site or sites with valid internet accessible domain names and play with that site before you update and add certificates to any live sites you care about. Once you figure out how things work it's easy to get certificates installed on a live site.

### The Easy Way: LetsEncrypt-Win-Simple

By far the easiest way to create and install a new certificate is LetsEncrypt-Win-Simple. This tool runs from the command line and has a few very easy to understand options. Basically you pick a site from the list of active Web sites using host headers on your server and the utility goes out and creates a certificate for you, creates an https binding and attaches the certificate. If there's already a certificate there the certificate is replaced with the new one.

This tool is basically wrapping up all the intermediate steps of creating a registration, domain and certificate. When you run again later it uses the existing store to retrieve the existing registration and domain information to run a renewal. You don't need to know anything about how the ACME API works or the pieces involved which is nice. Actually I wish I would have looked at this tool first before digging into the lower level tools as I did.

Installation is easy: You can install the latest version from their [GitHub Releases page](https://github.com/Lone-Coder/letsencrypt-win-simple/releases) and simply unzip the zip file into a folder. The zip file contains a single .NET executable Console application and the required SSH native debpendencies plus a couple configuration files.

To run it, simply open a command window, CD to the install folder and run:

```
LetsEncrypt
```

Here's what the interaction looks like (on my home machine which only has one host-headered site I added for testing):

[![LetsEncrypt-Win-Simple](https://weblog.west-wind.com/images/2016Windows-Live-Writer/Using-LetsEncrypt-with-IIS-on-Windows_AFF3/LetsEncrypt-Win-Simple_thumb_1.png "LetsEncrypt-Win-Simple")](https://weblog.west-wind.com/images/2016Windows-Live-Writer/Using-LetsEncrypt-with-IIS-on-Windows_AFF3/LetsEncrypt-Win-Simple_4.png)

(note that the site you're using here has to be internet accessible and you have to run these tools from the machine that will receive the certificate)

If all goes well, you'll end up with a new certificate installed in IIS on the Web site you specified.

[![SiteBindings](https://weblog.west-wind.com/images/2016Windows-Live-Writer/Using-LetsEncrypt-with-IIS-on-Windows_AFF3/SiteBindings_thumb.png "SiteBindings")](https://weblog.west-wind.com/images/2016Windows-Live-Writer/Using-LetsEncrypt-with-IIS-on-Windows_AFF3/SiteBindings_2.png)

If an existing certificate is installed it will be replaced with the new one. The utility is smart enough to detect existing Let's Encrypt certs and removes the old one and replaces it with the new one leaving only the new one in place. Any other certificates are simply left in place, but are not unbound.

> #### @icon-warning SNI – Multiple SSL Certificates per IP Address  
> Note that IIS by default allows only binding of a single SSL certificate to an IP Address. Starting with Server 2012 IIS support **Server Name Indication (SNI)** which allows you to bind multiple SSL certificates to a single IP Address. In order for this to work you need to make sure that every site using the same IP Address has the SNI flag checked as shown above. SNI binds the certificate to a host header rather than the IP Address. Note there are [issues with SNI support for old versions of IE on Windows XP](https://community.letsencrypt.org/t/which-browsers-and-operating-systems-support-lets-encrypt/4394) which won't properly navigate the SSL signature. If that's a problem you will need to stick with IP Bound SSL certificates.

If you open the site in a Web browser you can quickly check to see if the certificate is working, by clicking the secure icon and checking the certificate information. As you can see the certificate is the one created by Let's Encrypt.

[![Certificate](https://weblog.west-wind.com/images/2016Windows-Live-Writer/Using-LetsEncrypt-with-IIS-on-Windows_AFF3/Certificate_thumb.png "Certificate")](https://weblog.west-wind.com/images/2016Windows-Live-Writer/Using-LetsEncrypt-with-IIS-on-Windows_AFF3/Certificate_2.png)

What's nice is that you can simply re-run **LetsEncrypt** and it will go out and create a new certificate and remove the old one, so at any time when you need to renew/revoke it's quick and easy to update the certificate as needed.

Yay! This process is pretty straightforward and simple. LetsEncrypt-Win-Simple also has a few command line options that let you automate the domain to create the certificate for and disable prompts so you can automate this process as well. As the name implies LetsEncrypt-Win-Simple is simple without having to understand the gory details of how Let's Encrypt works behind the scenes and unless you have specific needs beyond registration this is the way to go IMHO.

#### Renewals

LetsEncrypt-Win-Simple also includes an interface to renew all certificates easily. You can run:

```
LetsEncrypt --renew
```

and it checks all sites it's managing for expiration dates and if expired (or on the day of expiration) it automatically renews and replaces the old cert with a new one. Nice!

The utility also creates a scheduled task that runs this command once a day and fires update requests. Note you might have to tweak the task User Identity settings [as described here](https://github.com/Lone-Coder/letsencrypt-win-simple/wiki/Windows-Task-Scheduler-Settings) to ensure that the user is logged on properly when running the scheduled task. Note that the user is the logged on user because this tool creates the Let's Encrypt vault in a %appdata%\letsencrypt-win-simple which is a user specific profile. It'd be much better if the vault was in a global location like \ProgramData so it can run under any account including system accounts. But that's a minor issue.

##AD##

### More Control with ACMESharp and PowerShell

If you want to work with the lower level ACME APIs directly and you want fine grained control over the cert creation process then ACMESharp's Powershell commandlets are a good way to do it. It's all based on a .NET library that provides the core interface to the ACME APIs so you can also automate your own applications.

LetsEncrypt works with a few core concepts:

*   A registration which is essentially an entity that's creating certificates (you or your company)
*   An identifier which is the domain name you are registering
*   A Certificate tied to that domain name

The process involves creating a registered account once, then creating multiple domains that can be registered. Each domain then can have multiple certificates associated with it over time.

The ACMESharp GitHub site has a pretty [good topic on how to get started](https://github.com/ebekker/ACMESharp/wiki/Quick-Start) that I was able to get going with that goes through the process of setting up a registration, setting up a domain and then creating the actual certificate.

Be forewarned – there are quite a few steps and the steps change if you're doing a renewal – it's not as simple as LetsEncrypt-win-simple although you can build something similar with ACMESharp (as LetsEncrypt-win-simple does as it uses the ACMESharp APIs). ACMESharp is a lower level tool that provides the API surface that you can build on top of.

But you can relatively easily use the Powershell interface to create new and renewal certificates. The process through these steps changes depending on whether you're doing a first time installation where you have to create the initial registration and domain or a renewal where you simply need to add a new certificate to an existing domain registration.

After quite a bit of experimenting with temporary domains I ended up with a parameterered Powershell script that I now use to register and update domains with. You might find this useful in addition to the instructions (for one thing it's easier to cut and paste from  if you do want to do the steps manually).

```ps
#install-Module -Name ACMESharp

import-module ACMESharp

$email = "mailto:rick@east-wind.com"
$domain = "codepaste.net"
$alias = "codepaste"
$iissitename = "codepaste.net"
$certname = "codepaste$(get-date -format yyyy-MM-dd--HH-mm)"
$pfxfile = "c:\Admin\Certs\$certname.pfx"

$initializevault = $FALSE
$createregistration = $FALSE
$createalias = $TRUE

# Change to the Vault folder
cd C:\ProgramData\ACMESharp\sysVault

# First time on the machine - intiialize vault
if($initializevault) 
{
    Initialize-ACMEVault
}

Get-ACMEVault

if($createregistration) 
{
    # Set up new 'account' tied to an email address
     New-AcmeRegistration -Contacts "$email" -AcceptTos
}

if($createalias)
{
 
    # Associate a new site 
    New-AcmeIdentifier -Dns $domain -Alias $alias

    # Prove the site exists and is accessible
    Complete-ACMEChallenge $alias -ChallengeType http-01 -Handler iis -HandlerParameters @{WebSiteRef="$iissitename"}

    # Validate site
    Submit-ACMEChallenge $alias -ChallengeType http-01

    # check until valid or invalid - pending
    Update-ACMEIdentifier $alias -ChallengeType http-01
    Update-ACMEIdentifier $alias -ChallengeType http-01 
}

# Generate a certificate
New-ACMECertificate ${alias} -Generate -Alias $certname

#Submit the certificate
Submit-ACMECertificate $certname

# Hit until values are filled in
update-AcmeCertificate $certname

pause

# Export Certifiacte to PFX file
Get-ACMECertificate $certname -ExportPkcs12 $pfxfile
```

Note that by setting the 3 boolean values you can control the flow for new and renewal certificates. The way the script is set up above it runs for a certificate renewal/update.

This script produces a PFX file which can then be imported into IIS. There are also tools to install and update existing certificates into IIS but it looks there are currently some changes in the API that made this not work for me. I wasn't able to even get the tools to load.

You can manually install the certificate with:

```
certutil -importPFX "c:\admin\certs\codepaste2016-02-28--20:22" –p password
```

or manually import it from the IIS Management Console and the IIS Certificates section. This works well for first time installs, but if you need to update an existing certificate then you still need to swap the certificates in IIS using the Management Console or command line tooling.

##AD##

### Certify – A Let's Encrypt GUI in the Making

<font color="#d16349" size="1">(updated March 10th, 2016)</font>

Certify is a visual GUI based tool that is also based on the ACMESharp library and provides a visual management interface to certificate operations. This tool is currently in Alpha and it's very rough – in fact when I initially tried it a few weeks back I wasn't able to actually get a certificate to create. However there's been a recent update that now has the basic features working even though the UI is still a bit rough.

The Certify UI pretty much reflects the terminology of a Vault, contact (email really) and domains and certificates and the UI reflects this hierarchy. You can create new domains and then attach new certificates to each domain. You can also use this UI to renew, export and apply the certificates directly into IIS Web Site bindings.

 ![](https://camo.githubusercontent.com/8683b3c1a3cc120885e0fef3e39bacef05641293/68747470733a2f2f636572746966797468657765622e636f6d2f696d616765732f73637265656e332e706e67)

The tool lets you create a new email contact, and then lets you add domains and certificates interactively. You can issue a new certificate. The certificate takes a minute or so to get generated and currently you have to refresh the Vault to see the updated, validated certificate. Once validated you can use Auto Apply to pick a Web Site and port to bind the certificate to. You can also export the certificate to a .pfx file, and you can ask to renew the certificate with Certify at any point.

This tool is clearly in Alpha stage, and while it doesn't work yet, it's nice to see a UI for this. Having a visual view of installed certificates and seeing status of certificates at a glance can be useful. It would be nice to see different colors based on the expiration state of certificates (red for expired, orange for a couple of weeks, green for valid) etc. Having a UI to see everything at a glance is really nice.

Keep an eye on this tool going forward.

### Where are we?

The idea of free and open source SSL certificates is certainly coming at the right time as we are looking at a big push from Google and other big Internet players to try and enforce SSL on every Internet connection. Running SSL can help prevent many HTTP, XSS and man in the middle type attacks by encrypting content and headers. Even though SSL certificates have gotten significantly cheaper, having an easy and 'official' way to create SSL certificates is going to do wonders to increase SSL usage. I know I have a handful of small side project sites that I can't justify spending even $20 a year for SSL on, but if it's free – hey, why the hell not.

It's not just about free certificates either – the fact that the certificate generation can be completely automated is also appealing especially with those that have large numbers of sites and certificates. Being able to check certificates once a day for expiration and renewing when within a day to keep things current makes for one less thing to worry about.

One issue that I see with Let's Encrypt in the current state of the tools is that certificates are valid for a maximum of 90 days or 3 months. This means you need to manage renewals much more frequently than your typical 1 year certificate. Let's Encrypt supposedly has mail notifications in place if certificates expire, but I haven't been able to try that out yet as the expirations are too far in the future. Automation of the renewal process is going to be key here – nobody will want to have manually renew certificates or even be notified every 3 months. I have 5 certificates on my Web server today and even a year for expiration is a big hassle as these certificates expire at different times of the year. To me the automation aspect is much more relevant than the cost.

Let's Encrypt itself is still under development and the Windows tools are even less mature. The base API exists and can be used today to create certificates as I've shown here, but there's a lot of work still to be done. The certificates created currently are the most basic certificates you can get. There's no support for wildcard certs, or higher end validated certs. It's not clear whether that will be supported in the future as setting up registrations for these types of certificates is much more involved. So today Let's Encrypt is not a solution for all SSL needs, but it definitely serves the low end sector well. And you definitely *can* use it today to get free SSL certificates if you're willing to put up with a little bit of growing pain. Especially using LetsEncrypt-win-simple it's pretty easy to get started and even keep things up to date.

In the future I hope we will see integration for services like Let's Encrypt directly built into Web servers. Having a common protocol for certificate registration seems so obvious in hindsight. Especially for IIS and Windows in general which has always been such a pain in the ass with certificate management. I suspect that we'll see this sort of integration sooner rather than later.

How do you see yourself using this service? Would you use it just because the service is free, or because of the automation opportunities? Sound off in comments.

### Resources
* [Code Magazine Article: Securing IIS Web Sites with Let’s Encrypt Certificates](https://weblog.west-wind.com/posts/2017/Dec/26/Code-Magazine-Article-Securing-IIS-Web-Sites-with-Lets-Encrypt-Certificates)
* [Moving to Lets Encrypt using Certify](https://weblog.west-wind.com/posts/2016/Jul/09/Moving-to-Lets-Encrypt-SSL-Certificates)
* [LetsEncrypt-Win-Simple](https://github.com/Lone-Coder/letsencrypt-win-simple)
* [ACMESharp Powershell Commands](https://github.com/ebekker/ACMESharp)
* [Certify The Web](http://certify.webprofusion.com/)
* [Let's Encrypt on Azure (Nik Molnar)](https://gooroo.io/GoorooTHINK/Article/16420/Lets-Encrypt-Azure-Web-Apps-the-Free-and-Easy-Way/20047#.Vsw4QpwrLAR)