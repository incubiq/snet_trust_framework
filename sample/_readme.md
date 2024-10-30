This sample code is provided as is. Here some indication how to use:

 - util_encrypt.js: a basic encryption / decryption API 
 - util_agent.js: connects directly to our Cloud Identity Agent (either local or prod). Taps into most of the agent APIs. You need a valid secret key to access the agent. 
 - const_did.js: an example of schema registration, although in our current implementation, we do not make use of schemas and create simpler VCs with adhoc claims. 
 - api_did.js: this is a copy of the code used by OpenSourceAIs to maintain its own Digital Identities. This code cannot be reused directly as it has a few dependencies not provided here (base class and DB), but most APIs can be reused with a simple copy paste and some little adaptation. Note that this is implemented for a custodial solution. A non-custodial would have a separation between issuers, verifiers, and would require a slightly different implementation. 
 