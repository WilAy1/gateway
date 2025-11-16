import { Request } from "express";
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

export function isValidURL(url: string) : boolean { 
    const urlRegexPattern = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
    return urlRegexPattern.test(url);
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


export function analyzeRequestParams(req: Request) {
    const ip = req.ip || req.connection.remoteAddress;

    const userAgent = req.headers['user-agent'];

    const deviceType = parseUserAgent(userAgent);

    return {
        ip: ip,
        userAgent: userAgent,
        deviceType: deviceType
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RequestParams {
    ip: string,
    userAgent: string,
    deviceType: string
}


export interface GWObject { // custom json
    [key: string]: never;
  }
  
export function removeKeys<T extends GWObject, K extends keyof T>(obj: T, keysToRemove: K[]): Omit<T, K> {
  const newObj = { ...obj };
  keysToRemove.forEach(key => delete newObj[key]);
  return newObj as Omit<T, K>;
}  

export function toFixed(num: number, fixed: number) {
    const re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}