const CryptoJS = require('crypto-js');

    const encrypt = function(_phrase) {
        const value = CryptoJS.AES.encrypt(_phrase, gConfig.encryptKey);
        return "_ENCRYPT_"+value;
    }

    const decrypt = function(_encrypted) {
        if (_encrypted.substring(0, 9)==='_ENCRYPT_') {
            let strDecrypt=_encrypted.substring(9, _encrypted.length);
            let bytes = CryptoJS.AES.decrypt(strDecrypt, gConfig.encryptKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        }
        return null;
    }

module.exports = {
    encrypt,
    decrypt
}