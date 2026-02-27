import { get, set, subscribe } from '@pooflabs/server';
import { getFiles, setFile } from '@pooflabs/server';
import { PublicKey } from '@solana/web3.js';
import { runQuery } from '@pooflabs/server';
/**
 * Time utility for server-time values
 *
 * Use this when you want to store the current server time in a numeric field
 *
 * Example:
 * // For a schema with { createdAt: "Int" } or { createdAt: "UInt" }
 * await setPost("123", {
 *   title: "My Post",
 *   createdAt: Time.Now  // Will be stored as the server's current timestamp
 * });
 */
export interface TimeOperation {
    operation: string;
    value: string;
}
/**
 * Increment utility for incrementing/decrementing numeric fields
 *
 * Use this when you want to increment or decrement a numeric field by a specific amount
 *
 * Example:
 * // For a schema with { viewCount: "UInt" } or { balance: "Int" }
 * await updatePost("123", {
 *   viewCount: Increment.by(1)  // Increments viewCount by 1
 * });
 * await updateAccount("456", {
 *   balance: Increment.by(-50)  // Decrements balance by 50
 * });
 */
export interface IncrementOperation {
    operation: string;
    value: number;
}
export type TokenName = 'USDC' | 'SOL' | 'pSOL' | 'other';
export interface TokenAmount {
    type: 'token';
    name: TokenName;
    amount: number;
}
/**
 * AddressType represents a Solana public key for use in request data.
 */
export interface AddressType {
    type: 'address';
    publicKey: PublicKey | string;
}
/**
 * Transforms special values (Time.now, Token.amount, Address.publicKey) in an object
 * to the format expected by the backend before sending the request.
 * This function is recursive and handles nested objects and arrays.
 */
declare const transformValues: (data: any) => any;
export declare const Token: {
    /**
     * Creates a TokenAmount object representing a specific amount of a token.
     * @param name The name of the token (e.g., 'USDC', 'SOL', 'pSOL').
     * @param amount The user-friendly amount (e.g., 10.5 for 10.5 USDC).
     */
    amount: (name: TokenName, amount: number) => TokenAmount;
    /**
     * Converts a TokenAmount object back to its integer representation based on decimals.
     * Useful if you need the raw integer value on the client side.
     */
    convert: (amount: TokenAmount) => number;
};
export declare const Time: {
    /**
     * Represents the server's current time. Use this value for 'Int' or 'UInt' fields
     * in request data where you want the server to insert the timestamp.
     */
    Now: TimeOperation;
};
export declare const Increment: {
    /**
     * Creates an increment/decrement operation for numeric fields.
     * Use positive values to increment, negative values to decrement.
     * @param value The amount to increment (positive) or decrement (negative)
     *
     * Example:
     * // Increment a counter by 1
     * await updatePost("123", { viewCount: Increment.by(1) });
     *
     * // Decrement a balance by 50
     * await updateAccount("456", { balance: Increment.by(-50) });
     */
    by: (value: number) => IncrementOperation;
};
export declare const Address: {
    /**
     * Creates an AddressType object from a PublicKey instance or a base58 string.
     * Validates the input and throws an error if invalid.
     * Special case: 'solana' is allowed as a reserved string representing native SOL.
     * @param key A PublicKey instance, a base58 encoded public key string, or 'solana' for native SOL.
     */
    publicKey: (key: PublicKey | string) => AddressType;
};
export { get, set, subscribe, getFiles, setFile, runQuery, transformValues, PublicKey };
/**
 * Common metadata fields added by TaroBase to document responses.
 */
export interface TarobaseMetadata {
    id: string;
    tarobase_created_at: number;
}
/**
 * Represents a file stored in TaroBase Storage.
 */
export interface FileItem {
    path: string;
    url: string;
}
/**
 * Represents a document operation for use with setMany.
 */
export interface DocumentOperation {
    path: string;
    document: any;
}
/**
 * Execute multiple document operations in a single atomic batch.
 * Use build* functions from collection files to create operations.
 *
 * @example
 * // Atomic update across collections
 * await setMany([
 *   buildUser(userId, { name: 'John' }),
 *   buildPost(postId, { author: userId }),
 * ]);
 */
export declare function setMany(operations: DocumentOperation[]): Promise<any>;
/**
 * Safely format an error for logging (avoids [object Object] in logs)
 * Handles circular references, empty messages, and non-Error objects
 * Always includes the full error object for comprehensive debugging
 */
export declare function formatError(error: unknown): string;
