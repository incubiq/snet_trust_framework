
const axios = require('axios').default;
const cDID = require('./const_did');

const didDomain=gConfig.isDebug? "http://localhost:7999/" : "https://identity.opensourceais.com/";
const apiAdmin = didDomain+ "api/v1/admin/";
const apiIdentity = didDomain+ "api/v1/identity/";
const apiSchema = didDomain+ "api/v1/schema/";
const apiWallet = didDomain+ "api/v1/wallet/";
const apiConnect = didDomain+ "api/v1/p2p/";
const apiVC = didDomain+ "api/v1/vc/";
const apiProof = didDomain+ "api/v1/proof/";

/*
 *       helpers
 */

    const getDefaultHeaders = function() {
        return { 
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36',
            "name": 'content-type',
            "value": 'application/json',
            "charset": "utf-8",
        }
    }

    const getAuthenticatedHeaders = function(_key) {
        return { 
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36',
            "name": 'content-type',
            "value": 'application/json',
            "charset": "utf-8",
            "apikey": _key
        }
    }

    const async_simpleGet = async function (_url, _key){
        try {
            let _objHeader = _key==null? getDefaultHeaders() : getAuthenticatedHeaders(_key);
            let response = await axios.get(_url, {
                headers: _objHeader
            });
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

    const async_simplePost = async function (_url, _key, objParam){
        let _objHeader = _key==null? getDefaultHeaders() : getAuthenticatedHeaders(_key);
        try {
            let response = await axios.post(_url, objParam, {
                headers: _objHeader
            });
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

    const async_simplePatch = async function (_url, _key, objParam){
        let _objHeader = _key==null? getDefaultHeaders() : getAuthenticatedHeaders(_key);
        try {
            let response = await axios.patch(_url, objParam, {
                headers: _objHeader
            });
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

    // a simple ping on the DID server (are you alive?)
    const async_ping = async function () {
        return async_simpleGet(didDomain, null);
    }

/*
 *       DID APIs / wallet + entities
 */

    // generate mnemonic
    const async_didUtil_generateMnemonic = async function (){
        return async_simplePost(apiWallet+"mnemonic/", null, {});
    }

    // get entity by id
    const async_didUtil_getEntityById = async function (_idEntity){
        return async_simpleGet(apiAdmin+"entity/"+_idEntity, null);
    }

    // get all entities
    const async_didUtil_getEntities = async function () {
        return async_simpleGet(apiAdmin+"entities", null);
    }

    // create an entity
    const async_didUtil_createEntityWithAuth = async function (objParam){
        return async_simplePost(apiAdmin+"entity", null, {
            name: objParam.name,
            role: objParam.role,
            mnemonic: objParam.mnemonic,
            id_wallet: objParam.id_wallet
        });
    }
 
/*
 *       DID APIs / DID
 */

    // get all DIDs for an entity
    const async_didUtil_getDidForEntity = async function (_key){
        return async_simpleGet(apiIdentity+"dids", _key);
    }

    // Add issuance capability to a DID
    const async_didUtil_updateDIDWithIssuance = async function (_key, _did){
        return async_simplePatch(apiIdentity+"did/"+_did, _key, {});
    }
 
/*
 *       DID APIs / Schemas
 */

    // ensure we have all our schemas registered
    // format: [{name: "example", version: "1.0.0", description: "some text", author: <published DID>, aTag: ["tag1", "tag2"], aProp: [{name: "abc", type: "string", isRequired: true}, {...}] }]
    const async_didUtil_ensureSchemas = async function (_key, _did){
        try {

            // create array of schemas
            let _aSchema = [cDID.SCHEMA_IDENTITY];
            _aSchema.forEach(item => {
                item.author=_did;
            })

            return async_simplePost(apiSchema+"install", _key, {
                aSchema: _aSchema
            });
        }
        catch (err) {
            throw err;
        }
    }

    // get all registered schemas (for a user - mostly for osais admin)
    const async_didUtil_getchemas = async function (_key){
        return async_simpleGet(apiSchema, _key);
    }

/*
 *       DID APIs / Connections
 */

    // create invite
    const async_didUtil_createInvite = async function (_key, fromUsername){
        return async_simplePost(apiConnect+"invite", _key, {
            from: fromUsername,
        });
    }

    // get connection details
    const async_didUtil_getConnectionById = async function (_key, _id){
        return async_simpleGet(apiConnect+_id, _key);
    }

    // get connections for Peer
    const async_didUtil_getConnectionsForPeer = async function (_key){
        return async_simpleGet(apiConnect, _key);
    }

    // accept invite
    const async_didUtil_acceptInvite = async function (_key, invitation){
        return async_simplePost(apiConnect+"accept", _key, {
            invitation: invitation,
        });
    }

    // connect peers (in custodial mode, an admin can connecty them both faster)
    const async_didUtil_connectPeers = async function (_key1, _name1, _key2, _name2){
        return async_simplePost(apiConnect+"custodial/connect", _key1, {
            key_peer1: _key1,
            key_peer2: _key2,
            name_peer1: _name1,
            name_peer2: _name2,
        });
    }
    
/*
 *       DID APIs / VC Definitions
 */

    // create VC definition
    const async_didUtil_createVCDefinition = async function (_key, objParam){
        return async_simplePost(apiVC+"definition", _key, {
            name: objParam.name,
            version: objParam.version,
            description: objParam.description,
            author: objParam.author,
            location: objParam.location,
            tags: objParam.tags,
        });
    }

    // get all VC definitions
    const async_didUtil_getAllDefinitions = async function (_key){
        return async_simpleGet(apiVC+"definitions", _key);
    }

    const async_didUtil_ensureDefinitions = async function (_key, _aSchema) {
        try {

            // for each schema, create its definition
            for (const item of _aSchema) {
                try {
                    let _dataDef = await async_didUtil_createVCDefinition(_key, {
                        name: item.name,
                        version: item.version,
                        description: item.description,
                        author: item.author,
                        location: item.schema["$id"],
                        tags: item.tags[0],         // we send the first tag only, they messed up their APIs to make it compatible with Schema        
                    });
                    return;
                }
                catch(err) {
                    throw err
                }
            }

        }
        catch (err) {
            throw err;
        }
    }

/*
 *       DID APIs / VC Offers
 */

    // get all offers sent/received
    const async_didUtil_getVCOffers = async function (_key, objParam){
        let _extra= (objParam && objParam.thid? "?thid="+objParam.thid: "");
        return async_simpleGet(apiVC+"offers"+_extra, _key);
    }
    
    // get a specific offer sent/received
    const async_didUtil_getVCOffer = async function (_key, objParam){
        return async_simpleGet(apiVC+"offer/"+objParam.id, _key);
    }

    // create offer
    const async_didUtil_createVCOffer = async function (_key, objParam){
        return async_simplePost(apiVC+"offer", _key, {
            validity: objParam.validity? objParam.validity: gConfig.did.validity,
            author: objParam.author,
            location: objParam.location,
            definition: objParam.definition,
            connection: objParam.connection,
            claims : objParam.claims? objParam.claims : {}
        })
    }
    const async_didUtil_createVCOfferWithoutSchema = async function (_key, objParam){
        return async_simplePost(apiVC+"offer-noschema", _key, {
            validity: objParam.validity? objParam.validity: gConfig.did.validity,
            author: objParam.author,
            connection: objParam.connection,
            claims : objParam.claims? objParam.claims : {}
        })
    }

    // accept offer
    const async_didUtil_acceptVCOffer = async function (_key, objParam){
        return async_simplePost(apiVC+"accept", _key, {
            recordId: objParam.recordId,            // recordId of the pending offer to accept (receiver pont of view)
            did: objParam.did,                      // published DID of the receiver  
        })
    }

    // issue VC
    const async_didUtil_issueVC = async function (_key, objParam){
        return async_simplePost(apiVC+"issue", _key, {
            recordId: objParam.recordId,            // recordId of the accepted offer (sender point of view)
        })
    }

    // issue Creds in custodial mode
    const async_didUtil_custodialCredentialIssuance = async function (_void, objParam){
        return async_simplePost(apiVC+"issuance/custodial", _void, {
            connection: objParam.connection,                     // the connectionId between verifier and prover (compulsory)
            key_peer1: objParam.key_peer1,                       // apikey of peer 1 (verifier)
            key_peer2: objParam.key_peer2,                       // apikey of peer 2 (prover)
            did_peer1: objParam.did_peer1,                       // short did of peer 1 (verifier)
            did_peer2: objParam.did_peer2,                       // short did of peer 2 (prover)
            validity:  objParam.validity? objParam.validity: gConfig.did.validity,    // offer valid for x seconds (30d by defalut)
            claims: objParam.claims,                             // the claims to be issued 
            noDuplicate: objParam.noDuplicate
        })
    }
    
/*
 *       DID APIs / Proofs
 */

    // ask for proof of existing VC (send a presentation request)
    const async_didUtil_canISeeYourVC = async function (_key, objParam){
        return async_simplePost(apiProof+"presentation", _key, {
            connection: objParam.connection,             // connection id between the 2
            challenge: objParam.challenge,               // a challenge that the other party can recognise
            domain: objParam.domain,
        })
    }

    // show proof of existing VC (accept a presentation request)
    const async_didUtil_youCanSeeMyVC = async function (_key, objParam){
        return async_simplePost(apiProof+"presentation/accept", _key, {
            presentationId: objParam.presentationId,         // presentation id (from holder point of view)
            recordId: objParam.recordId,                      // the recordId of the VC we will provide as proof
        })
    }

    // get all my presentation requests (or filter with thid)
    const async_didUtil_getPresentations = async function (_key, objParam) {
        let _extra= (objParam && objParam.thid? "thid="+objParam.thid+"&": "");
        if(objParam.status) {_extra=_extra+"status="+objParam.status}
        return async_simpleGet(apiProof+"presentations?"+_extra, _key);
    }
    
    // get a holder presentation matching a type which is located inside the VC
    const async_didUtil_getPresentationMatchingType = async function (_key, objParam) {
        return async_simpleGet(apiProof+"presentation/match/"+objParam.claim_type, _key);
    }
    
    // get the proof
    const async_didUtil_getProof = async function (_key, objParam){
        return async_simpleGet(apiProof+"presentation/"+objParam.presentationId, _key);
    }

    // issue proof in custodial mode
    const async_didUtil_custodialProofIssuance = async function (_void, objParam){
        return async_simplePost(apiProof+"presentation/custodial", _void, {
            connection: objParam.connection,                     // the connectionId between verifier and prover (compulsory)
            key_peer1: objParam.key_peer1,                       // apikey of peer 1 (verifier)
            key_peer2: objParam.key_peer2,                       // apikey of peer 2 (prover)
            claim_type:  objParam.claim_type,                    // the type that the VC must contain for a match
            domain: objParam.domain,
            noDuplicate: objParam.noDuplicate,
            thid: objParam.thid
        })
    }

module.exports = {

    async_ping,
    
// wallet 
    async_didUtil_generateMnemonic,

// entity 
    async_didUtil_getEntities,
    async_didUtil_getEntityById,
    async_didUtil_createEntityWithAuth,

// did
    async_didUtil_getDidForEntity,
    async_didUtil_updateDIDWithIssuance,

// schema
    async_didUtil_ensureSchemas,
    async_didUtil_getchemas,

// connections
    async_didUtil_createInvite,
    async_didUtil_acceptInvite,
    async_didUtil_getConnectionById,
    async_didUtil_getConnectionsForPeer,
    async_didUtil_connectPeers,

// vc definitions
    async_didUtil_createVCDefinition,
    async_didUtil_getAllDefinitions,
    async_didUtil_ensureDefinitions,

// vc offer
    async_didUtil_getVCOffers,
    async_didUtil_getVCOffer,
    async_didUtil_createVCOffer,
    async_didUtil_createVCOfferWithoutSchema,
    async_didUtil_acceptVCOffer,
    async_didUtil_custodialCredentialIssuance,

// vc issuance
    async_didUtil_issueVC,

// vc proof
    async_didUtil_canISeeYourVC,
    async_didUtil_youCanSeeMyVC,
    async_didUtil_getPresentations,
    async_didUtil_getPresentationMatchingType,
    async_didUtil_getProof,
    async_didUtil_custodialProofIssuance

}