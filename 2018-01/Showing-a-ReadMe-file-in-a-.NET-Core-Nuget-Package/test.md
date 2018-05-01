<div class="wikidoc">
<p>CODE Framework does its best to apply smart default settings to services (both server-side and client-side) for the typical type of application build with CODE Framework (business applications). Nevertheless, it is often desirable and necessary to change
 settings for services. This topic provides an overview of settings applicable to services.</p>
<p>Note that nearly all service settings (which are applied through the standard <a href="http://codeframework.codeplex.com/wikipage?title=CODE%20Framework%20Configuration%20System">
CODE Framework Configuration System</a>) can be made globally for all services, or individual on a per-service basis. For instance, it is possible to set the allowable message size for all services through the ServiceMessageSize setting, and it is possible
 to apply that setting for a single service (example: ICustomerService) by adding a ServiceMessageSize:ICustomerService setting.</p>
<p>It is also possible to add settings programmatically in various ways. The most common approach is to use static events fired by the ServiceGarden (server-side) and ServiceClient (client-side) classes. These events grant access to all the low level WCF objects,
 so any conceivable WCF setting or manipulation can be made. A very common use of this feature is to arbitrarily change the URL a service is hosted at.</p>
<p>&nbsp;</p>
<h3>Server-Side Settings</h3>
<p>These settings can be applied in server-side projects (these settings are used by the ServiceGarden class, which in turn is used by all CODE Framework WCF hosting environments):</p>
<table border="0" cellspacing="0" cellpadding="2">
<tbody>
<tr>
<td valign="top"><strong>Setting</strong></td>
<td valign="top"><strong>Default</strong></td>
<td valign="top"><strong>Description</strong></td>
</tr>
<tr>
<td valign="top">ServiceBaseUrl</td>
<td valign="top">localhost</td>
<td valign="top">Root URL services are hosted at. <br>
The default only applies for development environments.<br>
In a production environment, this should be set to something like &ldquo;www.mydomain.com&rdquo;</td>
</tr>
<tr>
<td valign="top">ServiceBasePort</td>
<td valign="top">50000</td>
<td valign="top">Base port used for TCP/IP (net.tcp) services. Ignored for all other service types.<br>
This setting defines the first utilized port number. The first TCP/IP service hosted will receive this port number. The next host is incremented by 1, and so forth.<br>
Note that this setting can only be set globally and not for individual services (although when launching services, a parameter on the host method allows defining the port explicitly)</td>
</tr>
<tr>
<td valign="top">ServiceBasePath</td>
<td valign="top">dev</td>
<td valign="top">Services are usually not just hosted at the root of a domain. For instance, a service project created to deal with payments is probably not hosted at
<a href="http://www.mydomain.com">www.mydomain.com</a>, but at <a href="http://www.mydomain.com/payments">
www.mydomain.com/payments</a>. In that case, ServiceBasePath would be set to &ldquo;payments&rdquo;.</td>
</tr>
<tr>
<td valign="top">ServiceMessageSize</td>
<td valign="top">medium</td>
<td valign="top">Size of messages the service can process. This has an impact on the maximum buffer size, maximum buffer pool size, maximum message size, maximum array length, and maximum string content length.<br>
CODE Framework supports 3 settings:<br>
Default: WCF defaults apply<br>
Medium: 10MB<br>
Large: 100MB<br>
VeryLarge: 1GB (this setting is not recommended!)<br>
Max: int.MaxValue, about 2GB (this setting is def. not recommended!)</td>
</tr>
<tr>
<td valign="top">ServiceBasicHTTPExtension</td>
<td valign="top">basic</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for Basic HTTP services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceWsHttpExtension</td>
<td valign="top">ws</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for WS HTTP services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceRestExtension</td>
<td valign="top">rest</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for REST services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceRestXmlFormatExtension</td>
<td valign="top">xml</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for REST XML services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceRestJsonFormatExtension</td>
<td valign="top">json</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for REST JSON services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceConcurrencyMode</td>
<td valign="top">multiple</td>
<td valign="top">Defines whether a single hosted service supports multiple simultaneous callers (see also: [WCF Self-Hosted Service Concurrency])</td>
</tr>
<tr>
<td valign="top">ServiceMaxConcurrentSessions</td>
<td valign="top">10</td>
<td valign="top">Defines how many concurrent sessions a single hosted service supports (if multiple simultaneous callers are allowed) (see also: [WCF Self-Hosted Service Concurrency])</td>
</tr>
<tr>
<td valign="top">ServiceMaxConcurrentCalls</td>
<td valign="top">10</td>
<td valign="top">Defines how many concurrent callers a single hosted service supports (if multiple simultaneous callers are allowed) (see also: [WCF Self-Hosted Service Concurrency])</td>
</tr>
<tr>
<td valign="top">ServiceSecurityMode</td>
<td valign="top">None</td>
<td valign="top">Defines the security mode for TCP/IP (NetTcp) services. Allowed settings are None, Message, Transport, and&nbsp;TransportWithMessageCredential.</td>
</tr>
</tbody>
</table>
<p>&nbsp;</p>
<h3>Client-Side Settings</h3>
<p>These settings can be applied in client-side projects (these settings are used by the ServiceClient class)</p>
<p>Defines the security mode for TCP/IP (NetTcp) services. Allowed settings are None, Message, Transport, and&nbsp;TransportWithMessageCredential.&Egrave;</p>
<table border="0" cellspacing="0" cellpadding="2">
<tbody>
<tr>
<td valign="top"><strong>Setting</strong></td>
<td valign="top"><strong>Default</strong></td>
<td valign="top"><strong>Description</strong></td>
</tr>
<tr>
<td valign="top">ServiceBaseUrl</td>
<td valign="top">localhost</td>
<td valign="top">Root URL services are hosted at. <br>
The default only applies for development environments.<br>
In a production environment, this should be set to something like &ldquo;www.mydomain.com&rdquo;</td>
</tr>
<tr>
<td valign="top">ServiceBasePath</td>
<td valign="top">dev</td>
<td valign="top">Services are usually not just hosted at the root of a domain. For instance, a service project created to deal with payments is probably not hosted at
<a href="http://www.mydomain.com">www.mydomain.com</a>, but at <a href="http://www.mydomain.com/payments">
www.mydomain.com/payments</a>. In that case, ServiceBasePath would be set to &ldquo;payments&rdquo;.</td>
</tr>
<tr>
<td valign="top">ServiceMessageSize</td>
<td valign="top">medium</td>
<td valign="top">Size of messages the service can process. This has an impact on the maximum buffer size, maximum buffer pool size, maximum message size, maximum array length, and maximum string content length.<br>
CODE Framework supports 3 settings:<br>
Default: WCF defaults apply<br>
Medium: 10MB<br>
Large: 100MB<br>
VeryLarge: 1GB (this setting is not recommended!)<br>
Max: int.MaxValue, about 2GB (this setting is def. not recommended!)</td>
</tr>
<tr>
<td valign="top">ServiceBasicHTTPExtension</td>
<td valign="top">basic</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for Basic HTTP services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceWsHttpExtension</td>
<td valign="top">ws</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for WS HTTP services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceProtocol</td>
<td valign="top">nettcp</td>
<td valign="top">Defines the protocol that is to be used to call the service. Possible values are BasicHTTP, WsHTTP, NetTCP, REST, and InProcess.<br>
<br>
Note: For more information on calling REST Services (such as those hosted in WebAPI), see
<a href="https://codeframework.codeplex.com/wikipage?title=Calling%20REST%20Services%20through%20ServiceClient">
Calling REST Services through ServiceClient</a>.</td>
</tr>
<tr>
<td valign="top">ServicePort</td>
<td valign="top">n/a</td>
<td valign="top">Defines the port to be used to call a service. This only applies to TCP/IP (net.tcp) services. Note that it makes no sense to set this setting globally. It needs to be made for each service (example: ServicePort:ICustomerService = 45000)</td>
</tr>
<tr>
<td valign="top">ServiceRestExtension</td>
<td valign="top">rest</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for REST services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceRestXmlFormatExtension</td>
<td valign="top">xml</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for REST XML services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceRestJsonFormatExtension</td>
<td valign="top">json</td>
<td valign="top">To differentiate between the same services hosted different ways, a suffix is usually added for REST JSON services URL unless this setting is an empty string in which case no suffix is added.</td>
</tr>
<tr>
<td valign="top">ServiceUrl</td>
<td valign="top">&nbsp;</td>
<td valign="top">This setting is used to define explicit service URLs. This is very commonly used for REST service calls. For SOAP-based services (BasicHttp and WsHttp), it can also be used when services are to be called from an arbitrary URL (such as when
 the service is hosted by IIS). Otherwise, it is more common to set individual service settings (like the base URL and extension and such). (Note: This setting is always set as ServiceUrl:IXxxService for each service&hellip;)</td>
</tr>
<tr>
<td valign="top">ServiceSecurityMode</td>
<td valign="top">None</td>
<td valign="top">Defines the security mode for TCP/IP (NetTcp) services. Allowed settings are None, Message, Transport, and&nbsp;TransportWithMessageCredential.</td>
</tr>
</tbody>
</table>
</div><div class="ClearBoth"></div>