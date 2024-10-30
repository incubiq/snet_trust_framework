# A Trust And Reputation Framework For AIs

This repo tracks the progress of the project submitted at https://deepfunding.ai/proposal/ai-digital-identity/

## Milestone 1: Design Of A Digital Identity Trust Framework
_Delivered 14 Sept 2024_

a.  Intro - An architecture review video explaining what we will focus on and the overall architecture of the project [6min 30sec video] https://youtu.be/_7k8IiHi2R0
 
b.  Proof that Identus is fit for purpose: [30min video] https://www.youtube.com/watch?v=4DyPuZr_3PA ; see also the full test scripts used for those tests : see [/test/identus](https://github.com/incubiq/snet_trust_framework/tree/main/test/identus)
 
c.  Specs of APIs for an open source Library making use of Identus and hiding the complexity of Identus: see [/specs/M1-APIs.pdf](https://github.com/incubiq/snet_trust_framework/tree/main/specs/M1-APIs.pdf). We may improve those specs later on as the project progresses, but those currently represent the minimum requirement to deliver what we need (Roles [Issuer, Holder, Verifier, admin], Entity, Wallet, DID, VC offer, VC, Proof, P2P secure and anon connection, Schemas). Each component has a clearly defined set of APIs.

d.  Tech stack choices:
   - the overall view of the different systems interacting with each other is described here: see [/specs/M1-design.pdf](https://github.com/incubiq/snet_trust_framework/tree/main/specs/M1-design.pdf) 
   - the Digital Identity Cloud Agent will be delivered in NodeJS   
   - we will NOT have a DB although the caller may need to store info provided by this Agent (like non custodial wallet seed phrase for example)
   - the initial Trust registry will be minimal ; we will issue creds based on formats passed to the Agent, as opposed to pre-defined validated formats


 ## Milestone 2: Delivery Of An Open Source Package

_Delivered 5 Oct 2024_

a. video proof of the Identity Agent running on localhost [30min video]: https://youtu.be/Ret9_FcK3rs 

b. source code: https://github.com/incubiq/snet_trust_framework/tree/main/src

c. fully documented API of the agent: https://incubiq.gitbook.io/opensourceais/identity-agent-lib 

d. Test scripts of the agent: https://github.com/incubiq/snet_trust_framework/tree/main/test/identity_agent


 ## Milestone 3: Delivery Of An Identity Cloud Agent

_Delivered 30 Oct 2024_

a. video proof of the Milestone [17min video]: https://youtu.be/RyZHXyVZPlY

b. source code: https://github.com/incubiq/snet_trust_framework/main/src

c. fully documented API of the agent: https://incubiq.gitbook.io/opensourceais/identity-agent-lib 

d. our live Cloud Identity Agent: https://identity.opensourceais.com 

e. proof of the identus cloud agent live (https://identus.opensourceais.com/cloud-agent/_system/health) and how to document to install it on AWS: https://github.com/incubiq/snet_trust_framework/blob/main/howto/setup_identus.md

f. sample source code for integration of the Cloud Identity Agent: https://github.com/incubiq/snet_trust_framework/tree/main/sample
