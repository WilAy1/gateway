import bcrypt from 'bcrypt';

const saltRounds = 10;

/**
 * Function to hash a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}

/**
 * Function to compare a password with a hashed password.
 * @param {string} password - The password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches the hashed password, false otherwise.
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}
