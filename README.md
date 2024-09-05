# A Trust And Reputation Framework For AIs

This repo tracks the progress of the project submitted at https://deepfunding.ai/proposal/ai-digital-identity/

## Milestone 1: Design Of A Digital Identity Trust Framework
_Delivered 6 Sept 2024_

a.  Intro - An architecture review video explaining what we will focus on and the overall architecture of the project [6min 30sec video] https://youtu.be/_7k8IiHi2R0
 
b.  Proof that Identus is fit for purpose: [30min video] https://www.youtube.com/watch?v=4DyPuZr_3PA
 
c.  Specs of APIs for an open source Library making use of Identus and hiding the complexity of DIDs/VCs: see [/test/identus](https://github.com/incubiq/snet_trust_framework/tree/main/test/identus), with over 35 APIs defined. We may improve those specs later on as the project progresses, but those currently represent the minimum requirement to deliver what we need (Roles [Issuer, Holder, Verifier, admin], Entity, Wallet, DID, VC offer, VC, Proof, P2P secure and anon connection, Schemas)

d.  Tech stack choices:
   - the Digital Identity Cloud Agent will be delivered in NodeJS   
   - we will NOT have a DB although the caller may need to store info provided by this Agent (like non custodial wallet seed phrase for example)
   - the initial Trust registry will be minimal ; we will issue creds based on formats passed to the Agent, as opposed to pre-defined validated formats


 ## Milestone 2: Delivery Of An Open Source Package

 TODO...
