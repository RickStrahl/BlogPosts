# Building and Consuming FoxPro REST API Services

REST APIs or Services that use plain HTTP requests and JSON have become the de facto replacement for the more complex SOAP Based architectures of the past. Most modern APIs available on the Web—from Credit Card Processors, to E-Commerce backends, to Mail services and Social Media data access—use REST services or variants thereof like GraphQL to make their remote data available for interaction.

REST based services tend to be much simpler to build and consume than SOAP services because they don't require any custom tooling like SOAP/WSDL services did and are using JSON which is inherently a much easier format to create and parse into usable object structures. All you need is an HTTP Client and a JSON parser and good API documentation.

In this session I'll demonstrate how to build a server-side REST API using both .NET Core and FoxPro (using West Wind Web Connection) and then demonstrate how to consume those APIs from a FoxPro client application using various JSON and Service client tools. I'll also discuss some common strategies for writing client side API code that helps with error handling and consistent access to API calls via wrappers that abstract API calls into easy to use application level classes that behave more like traditional business objects.

You will learn:

* What a REST API is
* How and why JSON is different than XML
* How to call a REST API with raw HTTP calls
* How to parse and send JSON between FoxPro and APIs
* How to call a REST API with high level service APIs
* How to organize API client code for resiliency and ease of integration
* Prerequisites: Some familiarity with Web Technologies. I'll be using some West Wind tools (provided with samples) to demonstrate the FoxPro features but concepts can be easily applied to other tools and even other platform.
