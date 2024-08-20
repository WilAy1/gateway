"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeKeys = exports.analyzeRequestParams = exports.parseUserAgent = exports.generateRandomHash = exports.isValidPassword = exports.isValidEmail = exports.codeGenerator = exports.isEmpty = exports.isValidUUID = exports.makeObjectUnique = void 0;
const crypto_1 = __importDefault(require("crypto"));
function makeObjectUnique(objArray) {
    const newObj = {};
    for (const obj of objArray) {
        const key = obj['key'];
        const value = obj['value'];
        if (Object.keys(newObj).includes(key)) {
            const prevArray = newObj[key];
            prevArray.push(value);
            newObj[key] = prevArray;
        }
        else {
            newObj[key] = [value];
        }
    }
    return newObj;
}
exports.makeObjectUnique = makeObjectUnique;
function isValidUUID(uuid) {
    const uuidRegexPattern = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
    const uuidRegex = new RegExp(uuidRegexPattern);
    return uuidRegex.test(uuid);
}
exports.isValidUUID = isValidUUID;
function isEmpty(data) {
    if (typeof data == "string")
        data = data.trim();
    return data.length === 0;
}
exports.isEmpty = isEmpty;
function codeGenerator(digits) {
    const pool = 'QWERTYUIOPASDFGHJKLZXCBNM1234567890'.split('');
    let code = "";
    for (let i = 0; i < digits; i++) {
        code += pool[Math.floor(Math.random() * pool.length)];
    }
    return code;
}
exports.codeGenerator = codeGenerator;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.isValidEmail = isValidEmail;
function isValidPassword(password) {
    return password.length >= 8;
}
exports.isValidPassword = isValidPassword;
function generateRandomHash(length) {
    // Generate a random string
    const randomString = crypto_1.default.randomBytes(length).toString('hex');
    // Generate a hash of the random string
    const hash = crypto_1.default.createHash('sha256');
    hash.update(randomString);
    const randomHash = hash.digest('hex');
    return randomHash;
}
exports.generateRandomHash = generateRandomHash;
function parseUserAgent(userAgent) {
    // Example implementation (you may need to extend this)
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'iOS';
    }
    else if (userAgent.includes('Android')) {
        return 'Android';
    }
    else if (userAgent.includes('Windows')) {
        return 'Windows';
    }
    else if (userAgent.includes('Macintosh')) {
        return 'Mac';
    }
    else if (userAgent.includes('Linux')) {
        return 'Linux';
    }
    else {
        return 'Unknown';
    }
}
exports.parseUserAgent = parseUserAgent;
function analyzeRequestParams(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceType = parseUserAgent(userAgent);
    return {
        ip: ip,
        userAgent: userAgent,
        deviceType: deviceType
    };
}
exports.analyzeRequestParams = analyzeRequestParams;
function removeKeys(obj, keysToRemove) {
    const newObj = { ...obj };
    keysToRemove.forEach(key => delete newObj[key]);
    return newObj;
}
exports.removeKeys = removeKeys;
//# sourceMappingURL=utils.js.map