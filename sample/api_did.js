
const apiBase = require('./base_publicApi_base');   // replace this by your base class
const didServices = require("./utils/util_agent");
const cryptoServices = require("./utils/util_encrypt");
const jwtDecode = require('jwt-decode');

/*
 *  Managing DIDs
 */

class publicApi_did extends apiBase {
  
    CLAIM_TYPE_IDENTITY() {return "identity"}
    CLAIM_TYPE_CALLER() {return "caller"}
    CLAIM_TYPE_WORKER() {return "worker"}
    CLAIM_TYPE_PROVIDER_GPU() {return "gpu_provider"}

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

        // for storing DID info into our local DB
        const classDBDID = require('../dbaccess/db_did');
        this.dbDID=new classDBDID({stdTTL: 864000});   // 10 day cache...
        this.cRoles=this.dbDID.getRoles();
    }

    getDIDRoles() {
        return this.cRoles;
    }

    getUsernameForDID (objPeer) {
        if(!objPeer) {
            return null;
        }
        // case of AI
        if (objPeer.hasOwnProperty("engine")) {
            return  objPeer.engine;
        }

        // case of Service Provider (Daemon)
        if (objPeer.hasOwnProperty("aMachine")) {
            return  objPeer.token;
        }

        // case of user / admin
        return objPeer.username;
    }

/*
 *  wallet / entities / DIDs
 */

    // creates a (wallet / entity / DID) in Identus and updates our DB
    async _async_CreateEntity (objParam) {
        try {
            // create entity and pwd
            let dataEntity = await didServices.async_didUtil_createEntityWithAuth({
                name: objParam.username,
                role: objParam.role,
                mnemonic: cryptoServices.decrypt(objParam.mnemonic),
                id_wallet: objParam.id_wallet
            });

            // update in DB
            let _objCreate = {
                created_at:  dataEntity.data.created_at,
                entity: dataEntity.data.id_entity,
                public_addr: dataEntity.data.public_addr,
                key: cryptoServices.encrypt(dataEntity.data.key),
                didLong: dataEntity.data.longDid,       // at least we get the long form did now...
                didAuth: null       // problem is.. the short form did will come a bit later... we will have to query again
            }
            if(objParam.isUser) {_objCreate.isUser=true;}
            if(objParam.isAI) {_objCreate.isAI=true;}
            if(objParam.isProvider) {_objCreate.isProvider=true;}

            let objDID =  await this.dbDID.async_updateOrCreateDID({
                username: objParam.username,
                role: objParam.role,
            }, null, _objCreate);

            this.consoleLog("created DID for "+objParam.username+", role "+objParam.role);

            return objDID;
        }
        catch(err) {
            throw err;
        }
    }

    getPublicDID(objDID) {
        if(objDID.key) {delete objDID.key}
        if(objDID.entity) {delete objDID.entity}
        if(objDID.mnemonic) {delete objDID.mnemonic}
        if(objDID.identity_thid) {delete objDID.identity_thid}
        if(objDID.a_worker_thid) {delete objDID.a_worker_thid}
        if(objDID.a_caller_thid) {delete objDID.a_caller_thid}
        if(objDID.a_provider_thid) {delete objDID.a_provider_thid}
        return objDID;
    }

    async async_ensureDID (objParam) {
        let objDIDCaller = null;        // the first DID registered for any Entity (they are ALL at least callers)
        let objDID = null;              // the DID we want to create for the specific role

        // create an Identus (wallet/Entity/DID) and update our DID structure for this user
        try {

            // do we have a caller DID?
            objDIDCaller = await this.dbDID.async_getDID({
                username: objParam.username,
                role: this.cRoles.ROLE_CALLER
            });

            // caller role must exist before creating any other.. so we ensure it is there first
            if(!objDIDCaller && objParam.role!==this.cRoles.ROLE_CALLER) {
                await this.async_ensureDID ({
                    username: objParam.username,
                    role: this.cRoles.ROLE_CALLER,
                    isUser: objParam.isUser? true: null,
                    isAI: objParam.isAI? true: null,
                })
            }

            if(objDIDCaller!==null && objParam.role===this.cRoles.ROLE_CALLER) {
                objDID=objDIDCaller;
            }

            // then do we have the DID we want?
            if(objDIDCaller && !objDID) {
                objDID = await this.dbDID.async_getDID({
                    username: objParam.username,
                    role: objParam.role
                });
            }

            // no DID? at least get a mnemonic and seed for this user (we will then reuse it to generate wallet and DID)
            let _wallet_id=null;        // do we have a wallet id from having created the DID Caller role ?
            if(!objDID || !objDID.public_addr) {

                let objCreate={
                    username: objParam.username,
                    role: objParam.role
                };

                // get a random mnemonic if first time this entity gets a DID
                if(!objDIDCaller || !objDIDCaller.public_addr) {
                    let dataMnemonic = await didServices.async_didUtil_generateMnemonic({});
                    objCreate.mnemonic= cryptoServices.encrypt(dataMnemonic.data.mnemonic);
                }
                else {
                    // reuse same wallet for entities with different roles
                    objCreate.mnemonic=objDIDCaller.mnemonic;
                    let _dataW=await didServices.async_didUtil_getEntityById(objDIDCaller.entity);
                    _wallet_id=_dataW.data.walletId;
                }

                objDID =  await this.dbDID.async_updateOrCreateDID({
                    username: objParam.username,
                    role: objParam.role,
                }, objCreate, objCreate);
            }

            // now get a full entity + wallet + did (all at once)
            if(objDID.mnemonic && !objDID.public_addr) {
                objDID = await this._async_CreateEntity({
                    username: objParam.username,
                    role: objParam.role,
                    mnemonic: objDID.mnemonic,
                    id_wallet: _wallet_id, 
                    isUser: objParam.isUser? true: null,
                    isAI: objParam.isAI? true: null,
                    isProvider: objParam.isProvider? true: null,
                })
            }

            // return decrypted obj
            objDID.mnemonic=cryptoServices.decrypt(objDID.mnemonic);
            objDID.key=cryptoServices.decrypt(objDID.key);

            // update didAuth if not already here
            if(!objDID.didAuth) {
                // get the did from the long form 
                let _didSplit = objDID.didLong.split(':');
                let _did = _didSplit[0]+":"+_didSplit[1]+":"+_didSplit[2];      // this is what we expect to get somewhere...
                let dataDids=await didServices.async_didUtil_getDidForEntity(objDID.key);
                if(dataDids && dataDids.data && dataDids.data.length>0) {

                    // have we got this published DID?
                    let _wasPublished=false;
                    dataDids.data.forEach(item => {
                        if((item.did===_did) && item.status === "PUBLISHED") {
                            _wasPublished=true;
                        }
                    })

                    if(_wasPublished) {
                        await this.dbDID.async_updateOrCreateDID({
                            username: objParam.username,
                            role: objParam.role,
                        }, null, {
                            didAuth: _did
                        });  
                        objDID.didAuth=_did;
                    }
                }
            }
            
            return {
                data: objDID
            }                
        }
        catch(err) {
            // we do not fail if DID is not processed correctly
            return {
                data: objDID? objDID: null
            }
            // throw err;
        }
    }

    // get the DID and add issuance capabilities
    async async_addIssuanceRightToDID (objParam) {
        try {
            let dataDID = await this.async_getDID({
                username: objParam.username,
                role: objParam.role
            });

            if(dataDID.data.canIssue) {
                return {data: true}
            }

            let dataDids=await didServices.async_didUtil_updateDIDWithIssuance(dataDID.data.key, dataDID.data.didAuth)

            // update DB
            await this.dbDID.async_updateOrCreateDID({
                username: objParam.username,
                role: objParam.role
            }, null, {
                canIssue: true
            });

            return dataDids;
        }
        catch(err) {
            throw err;
        }
    }

    // add a identity proof thid to the did (to act as identitity latest pres ID)
    async async_addIdentityProof (objParam) {
        try {
            // ensure we have a DID
            let dataDID = await this.async_getDID({
                username: objParam.username,
                role: objParam.role
            });

            // update
            await this.dbDID.async_updateOrCreateDID({
                username: objParam.username,
                role: objParam.role
            }, null, {
                identity_thid: objParam.identity_thid
            });

        }
        catch(err) {
            throw err;
        }
    }

    // add a Execution proof thid to the did 
    async async_addExecutionProof (objParam) {
        try {
            // ensure we have a DID
            let dataDID = await this.async_getDID({
                username: objParam.username,
                role: objParam.role
            });

            // which thid?
            const _type="a_"+objParam.role+"_thid";
            // change the array of execution thid (keep the last 10 only)
            let _a=dataDID.data[_type]? dataDID.data[_type]: [];
            _a.unshift(objParam.thid);
            if (_a.length > 10) {
                _a.pop();
            }

            // update
            let objUpd={};
            objUpd[_type]=_a;
            await this.dbDID.async_updateOrCreateDID({
                username: objParam.username,
                role: objParam.role
            }, null, objUpd);
        }
        catch(err) {
            throw err;
        }
    }

    async async_getDID (objParam) {
    
        // get the DID, or fail
        try {
            let objDID = await this.dbDID.async_getDID({
                username: objParam.username,
                role: objParam.role
            });

            // return decrypted obj
            if(objDID) {
                objDID.mnemonic=objDID.mnemonic? cryptoServices.decrypt(objDID.mnemonic) : null;
                objDID.key=objDID.key? cryptoServices.decrypt(objDID.key): null;    
            }
            return {data: objDID};
        }
        catch(err) {
            throw err;
        }
    }

/*
 *  registry schemas
 */

    async async_getSchemas (objParam) {
        return didServices.async_didUtil_getchemas(objParam.key);
    }

/*
 *  p2p connections
 */

    async async_getConnectionData (objParam) {
        return didServices.async_didUtil_getConnectionById(objParam.key, objParam.id);
    }

    // check that peer1 has sent a connection to peer2, if not send invite
    // if peer2 has not replied to invite, auto-reply here
    async async_ensureConnectionBetweenPeers (objPeer1, objPeer2) {
        try {
            let didName1=this.getUsernameForDID(objPeer1)
            let didName2=this.getUsernameForDID(objPeer2)

            let _dataPeer1 = await this.async_getDID({
                username: didName1,
                role: objPeer1.role
            })
            if(!_dataPeer1.data || !_dataPeer1.data.key) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "No DID key for entity peer1"    
                }
            }

            // do we already have a connection?
            let _objP2PInvite=null;
            let _wasAccepted=false;
            let _aP2P=[];
            if(_dataPeer1 && _dataPeer1.data && _dataPeer1.data.aP2P_accepted) {
                _aP2P=_dataPeer1.data.aP2P_accepted;
                _aP2P.forEach(item => {
                    if(item.recipient===didName2) {
                        _wasAccepted=true;
                        _objP2PInvite=item;
                        objPeer1.connection_id=item.connection_id;
                    }
                })
            }

            if(_wasAccepted) {
                return {data: {
                    from: didName1,
                    didFrom: _dataPeer1.data.didAuth,
                    to: didName2,
                    didTo: objPeer2.did? objPeer2.did.didAuth: null,
                    connection_id: objPeer1.connection_id,
                    isAccepted: true
                }}
            }

            let _dataPeer2 = await this.async_getDID({
                username: didName2,
                role: objPeer2.role
            })
            if(!_dataPeer2.data || !_dataPeer2.data.key) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "No DID key for entity peer2"    
                }
            }


            // then, do we have an invite?
            let _wasInvited=false;
            if(_dataPeer1 && _dataPeer1.data && _dataPeer1.data.aP2P_pending) {
                _aP2P=_dataPeer1.data.aP2P_pending;
                _aP2P.forEach(item => {
                    if(item.recipient===didName2) {
                        _wasInvited=true;
                        _objP2PInvite=item;
                        objPeer1.connection_id=item.connection_id;
                    }
                })
            }

            // not invited yet? do the full invite / accept in one go
            if(!_wasInvited) {
                let _dataConnect=await didServices.async_didUtil_connectPeers(_dataPeer1.data.key, didName1, _dataPeer2.data.key, didName2);

                // update point of view Peer 1
                await this.dbDID.async_updateOrCreateDID({
                    username: didName1,
                    role: _dataPeer1.data.role,
                }, null, {
                    "$addToSet": {
                        aP2P_accepted: {
                            connection_id: _dataConnect.data.connection_id_from,
                            recipient: didName2
                        }
                    }                    
                });  

                // update point of view Peer 2
                await this.dbDID.async_updateOrCreateDID({
                    username: didName2,
                    role: _dataPeer2.data.role,
                }, null, {
                    "$addToSet": {
                        aP2P_accepted: {
                            connection_id: _dataConnect.data.connection_id_to,
                            recipient: didName1
                        }
                    }    
                });      

                return {data: {
                    from: didName1,
                    didFrom: _dataPeer1.data.didAuth,
                    to: didName2,
                    didTo: _dataPeer2.data.didAuth,
                    connection_id: _dataConnect.data.connection_id_from,
                    isAccepted: true
                }}
            }

            // peer2 was already invited but did not reply yet
            // now we will accept invite (or check if already accepted and missed)
            let _dataAccept={data:null};
            let _objP2PAccept=null;
            let _dataConnect=await didServices.async_didUtil_getConnectionById(_dataPeer1.data.key, objPeer1.connection_id);

            // sure we are not connected? 
            let _connectionIdForInvitee=null;
            if(_dataConnect.data.hasOwnProperty("theirDid")) {
                // we were connected, just OSAIS not up to date
                // get the connection...
                let _dataC=await didServices.async_didUtil_getConnectionsForPeer(_dataPeer2.data.key);
                _dataC.data.forEach(item => {
                    if(item.thid===_objP2PInvite.connection_id) {
                        _connectionIdForInvitee=item.connectionId;
                    }
                })
            }
            else {
                // peer 2 accepts the connection invite
                let _oob=_dataConnect.data.invitation.invitationUrl.replace("https://my.domain.com/path?_oob=","");
                _dataAccept= await didServices.async_didUtil_acceptInvite(_dataPeer2.data.key, _oob);
                _connectionIdForInvitee=_dataAccept.data.connectionId;
            }

            // Now we are accepted, we store it in DB (both sides)
            // update point of view Peer 1
            await this.dbDID.async_updateOrCreateDID({
                username: didName1,
                role: _dataPeer1.data.role,
            }, null, {
                "$pull" : {
                    aP2P_pending: _objP2PInvite
                },
                "$addToSet": {
                    aP2P_accepted: _objP2PInvite
                }                    
            });  

            // update point of view Peer 2
            _aP2P=_dataPeer2.data.aP2P? _dataPeer2.data.aP2P : [];
            _objP2PAccept={
                connection_id: _connectionIdForInvitee,
                recipient: didName1
            }

            await this.dbDID.async_updateOrCreateDID({
                username: didName2,
                role: _dataPeer2.data.role,
            }, null, {
                "$addToSet": {
                    aP2P_accepted: _objP2PAccept
                }    
            });            

            return {data: {
                from: didName1,
                didFrom: _dataPeer1.data.didAuth,
                to: didName2,
                didTo: _dataPeer2.data.didAuth,
                connection_id: _objP2PInvite? _objP2PInvite.connection_id: null,
                isAccepted: true
            }}
        }
        catch(err) {
            throw err;
        }
    }

/*
 *  VC Definitions
 */
    
    // 
    async async_createVCDefinition (objParam) {
        return didServices.async_didUtil_acceptInvite(objParam.key, objParam);
    }

/*
 *  VC Offers
 */
    

/*
 *      VC Proofs
 */
    async _async_getPresentationMatchingType(objParam) {
        try{
            let dataRet= await didServices.async_didUtil_getPresentationMatchingType(objParam.key, {                
                claim_type: objParam.claim_type
            });

            return dataRet;
        }
        catch(err) {
            // nothing found...
            return {
                data: null
            };
        }          
    }


    // Get a Proof pf claim for this AI (full loop with verifier / Prover)
    // objPeer must contain a role and a DID with key ; objClaim must contain a claim_type
    async async_issueCustodialProof(objPeer, objClaim, fnUpdateThid, bNoDuplicate) {
        try {
            const roles=this.getDIDRoles();

            // do we have such a Proof already?
            let dataProof=null;
            if(bNoDuplicate) {
                dataProof=await this._async_getPresentationMatchingType({
                    key: objPeer.did.key,
                    claim_type: objClaim.claim_type
                });    
                if(dataProof.data) {
                    fnUpdateThid(dataProof.data.thid);        
                    return {
                        data: {
                            proof: dataProof.data,
                        }
                    }    
                }
            }

            // ensure that OSAIS has a private connection with this Peer
            let _dataConnect = await this.async_ensureConnectionBetweenPeers({
                username: "osais",
                role: roles.ROLE_ADMIN    
            }, objPeer);    

            // !! from now, not awaiting those ones...

            // issue VC
            didServices.async_didUtil_custodialCredentialIssuance(null, {
                connection: _dataConnect.data.connection_id,
                key_peer1: gConfig.app.apiAdmin.getAdminKey(),
                key_peer2: objPeer.did.key,
                did_peer1: _dataConnect.data.didFrom,
                did_peer2: objPeer.did.didAuth,
                validity: gConfig.did.validity,
                claims: objClaim,
                noDuplicate: bNoDuplicate    
            })
            .then(_data => {

                // full loop to obtail proof of claim
                didServices.async_didUtil_custodialProofIssuance(null, {
                    connection: _dataConnect.data.connection_id,                    // the connectionId between verifier and prover (compulsory)
                    key_peer1: gConfig.app.apiAdmin.getAdminKey(),                  // apikey of peer 1 (verifier)
                    key_peer2: objPeer.did.key,                                       // apikey of peer 2 (prover)
                    claim_type:  objClaim.claim_type,                     // the type that the VC must contain for a match
                    domain: gConfig.origin,
                    noDuplicate: bNoDuplicate,
                    thid: _data.data && _data.data.vc? _data.data.vc.thid : null
                })
                .then(_dataProof => {
                    if(_dataProof && _dataProof.data) {
                        // update the thid in DB
                        fnUpdateThid(_dataProof.data.thid);        
                    }
                })
                .catch(err => {})
            })
            .catch(err => {})

            return {
                data: {
                    proof: null,
                }
            }
        }
        catch(err) {
            throw err;
        }
    }

    // get a proof certif
    async async_getCertificates(objParam) {
        try {           
            let dataProof=await didServices.async_didUtil_getPresentations(objParam.key, {
                status : objParam.status,
                thid: objParam.thid? objParam.thid: null
            });

            // remove sensitive and irrelevant info 
            let _aRet=[];
            let _aTmpClaim=[];      // only here to check on duplicates
            const isDuplicate = (arr, obj) => {
                return arr.some((item) => JSON.stringify(item) === JSON.stringify(obj));
            };
            dataProof.data.forEach(_certif => {
                if(_certif.connectionId) {delete _certif.connectionId}
                if(_certif.metaRetries) {delete _certif.metaRetries}
                if(_certif.requestData) {delete _certif.requestData}
        
                // add claims
                const decoded_wrapper = jwtDecode(_certif.data[0]);
                const encoded_proof=decoded_wrapper.vp.verifiableCredential[0];
                const decoded_proof = jwtDecode(encoded_proof);
                delete decoded_proof.vc.credentialSubject.id;
                _certif.claims=decoded_proof.vc.credentialSubject;

                // if claims are exact same as already registered... then do not keep this duplicate...
                if(!isDuplicate(_aTmpClaim, _certif.claims)) {
                    _aRet.push(_certif);
                    _aTmpClaim.push(_certif.claims);    
                }
            })
            return {data: _aRet};
        }
        catch(err) {
            throw err;
        }
    }
}

module.exports = publicApi_did;
