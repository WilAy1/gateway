"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 10;
/**
 * Function to hash a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, saltRounds);
}
exports.hashPassword = hashPassword;
/**
 * Function to compare a password with a hashed password.
 * @param {string} password - The password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches the hashed password, false otherwise.
 */
async function comparePassword(password, hashedPassword) {
    return bcrypt_1.default.compare(password, hashedPassword);
}
exports.comparePassword = comparePassword;
//# sourceMappingURL=passwordUtils.js.map