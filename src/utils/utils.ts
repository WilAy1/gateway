import { UniqueObject } from "../interfaces/db.interface";
import crypto from 'crypto';

export function makeObjectUnique (objArray) : UniqueObject {
    const newObj : object = {};
    for (const obj of objArray) {
        const key = obj['key'];
        const value = obj['value'];
        if(Object.keys(newObj).includes(key)){
            const prevArray = newObj[key];
            prevArray.push(value)
            newObj[key] = prevArray;
        }
        else {
            newObj[key] = [value];
        }
    }
    return newObj as UniqueObject;
}

export function isValidUUID(uuid: string): boolean {
    const uuidRegexPattern: string = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
    const uuidRegex: RegExp = new RegExp(uuidRegexPattern);
    return uuidRegex.test(uuid);
}

export function isEmpty(data: Array<unknown> | string) {
    if (typeof data == "string") data = data.trim();
    return data.length === 0;
}

export function codeGenerator(digits : number) {
    const pool = 'QWERTYUIOPASDFGHJKLZXCBNM1234567890'.split('');
    let code = "";
    for(let i = 0; i < digits; i++){
        code += pool[Math.floor(Math.random()*pool.length)];
    }
    return code;
}



export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


export function isValidPassword(password: string): boolean {
    return password.length >= 8;
}


export function generateRandomHash(length: number): string {
    // Generate a random string
    const randomString = crypto.randomBytes(length).toString('hex');
    
    // Generate a hash of the random string
    const hash = crypto.createHash('sha256');
    hash.update(randomString);
    const randomHash = hash.digest('hex');
    
    return randomHash;
}


export function parseUserAgent(userAgent) {
    // Example implementation (you may need to extend this)
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'iOS';
    } else if (userAgent.includes('Android')) {
        return 'Android';
    } else if (userAgent.includes('Windows')) {
        return 'Windows';
    } else if (userAgent.includes('Macintosh')) {
        return 'Mac';
    } else if (userAgent.includes('Linux')) {
        return 'Linux';
    } else {
        return 'Unknown';
    }
}