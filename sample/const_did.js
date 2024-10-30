

/*
 *       DID Const / Schema
 */

    const OSAIS_SCHEMA_USER_IDENTITY=[{
        prop: "entity",
        display: "Entity",
        type: "string"
    }, {
        prop: "username",
        display: "Username",
        type: "string"
    }, {
        prop: "firstname",
        display: "First Name",
        type: "string"
    }, {
        prop: "lastname",
        display: "Last Name",
        type: "string"
    }, {
        prop: "identity_provider",
        display: "Identity Provider",
        type: "string"
    }, {
        prop: "created_at",
        display: "Created at",
        type: "date"
    }]

    const OSAIS_SCHEMA_USER_CALLER=[{
        prop: "uid_tx",
        display: "Transaction ID",
        type: "int"
    }, {
        prop: "executed_at",
        display: "Executed at",
        type: "date"
    }, {
        prop: "cost_in_usd",
        display: "Cost (in USD)",
        type: "float"
    }]

    const OSAIS_SCHEMA_DAEMON_IDENTITY=[{
        prop: "entity",
        display: "Entity",
        type: "string"
    }, {
        prop: "token",
        display: "Daemon",
        type: "string"
    }, {
        prop: "owner",
        display: "Owner",
        type: "string"
    }, {
        prop: "created_at",
        display: "Created at",
        type: "date"
    }]

    const OSAIS_SCHEMA_DAEMON_PROVIDER=[{
        prop: "daemon",
        display: "Daemon",
        type: "string"
    }, {
        prop: "machine",
        display: "Machine",
        type: "string"
    }, {
        prop: "gpu",
        display: "GPU",
        type: "string"
    }, {
        prop: "uid_tx",
        display: "Transaction ID",
        type: "int"
    }, {
        prop: "executed_at",
        display: "Executed at",
        type: "date"
    }, {
        prop: "cost_in_sec",
        display: "Cost (in seconds)",
        type: "float"
    }, {
        prop: "cost_in_usd",
        display: "Cost (in USD)",
        type: "float"
    }]

    const OSAIS_SCHEMA_AIAGENT_IDENTITY=[{
        prop: "entity",
        display: "Entity",
        type: "string"
    }, {
        prop: "name",
        display: "Engine",
        type: "string"
    }, {
        prop: "uid",
        display: "UID",
        type: "string"
    }, {
        prop: "docker_image",
        display: "Docker image",
        type: "string"
    }, {
        prop: "created_at",
        display: "Created at",
        type: "date"
    }]

    const OSAIS_SCHEMA_AIAGENT_WORKER=[{
        prop: "uid_tx",
        display: "Transaction ID",
        type: "int"
    }, {
        prop: "executed_at",
        display: "Executed at",
        type: "date"
    }, {
        prop: "cost_in_usd",
        display: "Cost (in USD)",
        type: "float"
    }, {
        prop: "cost_in_sec",
        display: "Cost (in seconds)",
        type: "float"
    }]

    // IDENTUS RELATED SCHEMAS (currently unused)
    const SCHEMA_IDENTITY_UID= "ai_identity";
    const SCHEMA_IDENTITY= {
        "name": "ai_identity",
        "version": "1.0.1",
        "description": "An AI's identity attributes",
        "author": null,
        "aTag": [
          "AI",
        ],
        "aProp": [
            {
                "name" : "uid",         // OSAIS internal uid
                "type": "string",       
                "isRequired": true
            }, {
                "name" : "name",         // name of the AI
                "type": "string",       
                "isRequired": true
            }, {
                "name" : "repo",         // location of the AI source repo (usually github)
                "type": "string",       
                "isRequired": true
            }
        ]
    };

    // how claims are expected to be structured for each type (this is a shortcut if we do not use schema)
    const CLAIM_IDENTITY = {
        uid: "<a uid>", 
        name: "<a name>"
    }

module.exports = {
    OSAIS_SCHEMA_USER_IDENTITY,
    OSAIS_SCHEMA_USER_CALLER,    
    OSAIS_SCHEMA_DAEMON_IDENTITY,
    OSAIS_SCHEMA_DAEMON_PROVIDER,
    OSAIS_SCHEMA_AIAGENT_IDENTITY,
    OSAIS_SCHEMA_AIAGENT_WORKER,

    // unsused
    SCHEMA_IDENTITY_UID,
    SCHEMA_IDENTITY,
    CLAIM_IDENTITY,
}
