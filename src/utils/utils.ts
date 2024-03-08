import { UniqueObject } from "../interfaces/db.interface";

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