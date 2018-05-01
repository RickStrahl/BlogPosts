# Custom Error Handling in an ASP.NET Core API

When building any API implementation, one of the key requirements for me is that the API should always - as much as possible anyway - return a JSON response. By default, ASP.NET Core returns an error page, or an error status only if you don't hook up error pages, which are not really appropriate for API applications. Ultimately, I think that every response possible should be an API response that can be sent back to client that can take some sort of action on the error information. 

Simply stated this means:

> An error result should never be HTML or empty error page - it should always be a proper API response.

### Types of Errors
This sounds easy enough, but really there are number of different errors that can occur, some of which your actual application may have no control over. That's why I said early *as much as possible* because errors that occur at the network or proxy layer or even in the base pipeline of Kestrel may not be capturable (sp) by your code. 

Errors that might see are (in reverse from high level to low):

* Explicit application thrown errors
* Unhandled application errors
* Framework errors
* Web Server/Proxy Error (IIS, NGINX etc.)
* Network errors


### Low Level Errors
The last two are out of your control inside of your application. If an error occurs in the IIS front end to your Kestrel ASP.NET Core application, you have very little control over how the error is presented. If an error occurs here 

You can potentially hook up an old style `Application_Error` handler but realize that won't capture all failures. ASP.NET Core runs using a custom IIS extension which is a native module and all it really does is forward requests to Kestrel and ensures that Kestrel is running and stays running. 

My policy on this is that if something is wrong at this low level, the default error handling provided by the server/proxy is usually more useful than anything I could do at the application level, so I'm not going to worry about this.

### Application Level Errors
Application level errors however I do want control over for a number of reasons. First I want to know about errors that happen, so at the very least some logging should be hooked up to make sure the errors are recorded or even better end up notifying me.

Second I want to make sure that the front end is notified of the errors - not just as a generic failure, but hopefully with some additional information that allows the front end user to make a smart decision on how to fix the problem.

Application errors fall into two categories:

* Unhandled exceptions
* Explicitly triggered errors

### API Error Handling Strategy
In my API application I tend to use a specific strategy for reporting errors, which is that I throw specific exception types to notify the client of errors. Any of these explicitly thrown errors are handled in a specific way by my API using filters while unhandled exceptions are handled somewhat differently. 

#### Explicit Application Errors
For handled exceptions I return the error message back to the client. These exceptions were explicitly triggered and are meant to be seen by the client. These include things like Validation errors, or request errors due to invalid inputs typically. For example, on a Login form I might ask the user to log in but return an application generated error message to the client (eg. *Invalid username and password*).

#### Unhandled Exceptions
Unhandled exceptions I still want to return to the client as errors, but in most cases I probably don't want to pass anything but a very general exception message back to the client. Exception messages are typically undesirable to send back because they may contain sensitive information.

Obviously, as much as possible, application code should avoid unhandled exceptions, but as we all know **shit happens** and so we need to handle it.


### ASP.NET Core MVC Filters
ASP.NET MVC combines MVC and API features into a single platform (called ASP.NET Core MVC) and a single set of Filters can be used to apply to either style of programming.





<!-- Post Configuration -->
<!--
```xml
<blogpost>
<abstract>

</abstract>
<categories>

</categories>
<keywords>

</keywords>
<weblogs>
<postid></postid>
<weblog>
Rick Strahl's Weblog
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->
