# A Trust And Reputation Framework For AIs

This repo tracks the progress of the project submitted at https://deepfunding.ai/proposal/ai-digital-identity/

## Milestone 1

 1.  Intro - An architecture review video explaining what we will focus on and the overall architecture of the project [8min video]
 2.  Proof that Identus is fit for purpose: [30min video] https://www.youtube.com/watch?v=4DyPuZr_3PA
 3.  Tech stack choices:
   - the Digital Identity Cloud Agent will be delivered in NodeJS   
   - we will NOT have a DB although the caller may need to store info provided by this Agent (like non custodial wallet seed phrase for example)
   - the initial Trust registry will be minimal ; we will issue creds based on formats passed to the Agent, as opposed to pre-defined validated formats
 4.  Specs of APIs for an open source Library making use of Identus and hiding the complexity of DIDs/VCs: see /test/identus, with over 35 APIs defined

 ## Milestone 2

 TODO...
