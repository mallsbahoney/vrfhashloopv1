import { PublicKey } from '@solana/web3.js';
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
 * Used by build functions to create properly typed operations.
 */
export interface DocumentOperation {
    path: string;
    document: any;
}
/**
 * Execute multiple document operations in a single batch.
 * @param operations Array of DocumentOperation objects created by build functions
 * @returns Promise resolving to the result of the batch operation
 */
export declare function setMany(operations: DocumentOperation[]): Promise<any>;
/**
 * Safely format an error for logging (avoids [object Object] in logs)
 * Handles circular references, empty messages, and non-Error objects
 * Always includes the full error object for comprehensive debugging
 */
export declare function formatError(error: unknown): string;
/**
 * Handles AdminFiles files (Get Single File based on its ID, null if not found)
 */
export declare function getAdminFiles(fileId: string): Promise<FileItem | null>;
/**
 * Handles AdminFiles files (Upload/Replace a File and persist it keyed by its ID) To get the file URL use the getAdminFiles function right after this one.
 * @returns A boolean indicating whether the upload succeeded (true) or failed (false). Always check this value to confirm the upload worked.
 */
export declare function uploadAdminFiles(fileId: string, file: File): Promise<boolean>;
/**
 * Handles AdminFiles files (Delete File based on its ID)
 * @returns A boolean indicating whether the delete succeeded (true) or failed (false). Always check this value to confirm the delete worked.
 */
export declare function deleteAdminFiles(fileId: string): Promise<boolean>;
/**
 * Handles AppFiles files (Get Single File based on its ID, null if not found)
 */
export declare function getAppFiles(fileId: string): Promise<FileItem | null>;
/**
 * Handles AppFiles files (Upload/Replace a File and persist it keyed by its ID) To get the file URL use the getAppFiles function right after this one.
 * @returns A boolean indicating whether the upload succeeded (true) or failed (false). Always check this value to confirm the upload worked.
 */
export declare function uploadAppFiles(fileId: string, file: File): Promise<boolean>;
/**
 * Handles AppFiles files (Delete File based on its ID)
 * @returns A boolean indicating whether the delete succeeded (true) or failed (false). Always check this value to confirm the delete worked.
 */
export declare function deleteAppFiles(fileId: string): Promise<boolean>;
export interface CommonQueriesRequest {
}
export interface CommonQueriesResponse {
    id: string;
    tarobase_created_at: number;
}
/**
 *
  Read Operation Details: Anyone can use these queries: (1) Balance queries - check SOL, USDC, or any SPL token balance for any wallet address. (2) Jupiter swap quotes - get expected output amounts for token swaps via Jupiter aggregator. (3) Meteora swap quotes - get expected output amounts for Meteora dynamic bonding curve pools.
   (Get Single Item)
 */
export declare function getCommonQueries(queryId: string): Promise<CommonQueriesResponse | null>;
/**
 * Subscribes to changes in a single CommonQueries document. (
  Read Operation Details: Anyone can use these queries: (1) Balance queries - check SOL, USDC, or any SPL token balance for any wallet address. (2) Jupiter swap quotes - get expected output amounts for token swaps via Jupiter aggregator. (3) Meteora swap quotes - get expected output amounts for Meteora dynamic bonding curve pools.
  )
 */
export declare function subscribeCommonQueries(callback: (data: CommonQueriesResponse | null) => void, queryId: string): Promise<() => Promise<void>>;
/**
 * Get many CommonQueries items from collection commonQueries
 
  Read Operation Details: Anyone can use these queries: (1) Balance queries - check SOL, USDC, or any SPL token balance for any wallet address. (2) Jupiter swap quotes - get expected output amounts for token swaps via Jupiter aggregator. (3) Meteora swap quotes - get expected output amounts for Meteora dynamic bonding curve pools.
  
 */
export declare function getManyCommonQueries(filter?: string): Promise<CommonQueriesResponse[]>;
/**
 * Subscribe to changes in CommonQueries collection at commonQueries
 
  Read Operation Details: Anyone can use these queries: (1) Balance queries - check SOL, USDC, or any SPL token balance for any wallet address. (2) Jupiter swap quotes - get expected output amounts for token swaps via Jupiter aggregator. (3) Meteora swap quotes - get expected output amounts for Meteora dynamic bonding curve pools.
  
 */
export declare function subscribeManyCommonQueries(callback: (data: CommonQueriesResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all CommonQueries items from collection commonQueries
 
  Read Operation Details: Anyone can use these queries: (1) Balance queries - check SOL, USDC, or any SPL token balance for any wallet address. (2) Jupiter swap quotes - get expected output amounts for token swaps via Jupiter aggregator. (3) Meteora swap quotes - get expected output amounts for Meteora dynamic bonding curve pools.
  
 */
export declare function getAllCommonQueries(filter?: string): Promise<CommonQueriesResponse[]>;
/**
 * Subscribe to changes in CommonQueries collection at commonQueries
 
  Read Operation Details: Anyone can use these queries: (1) Balance queries - check SOL, USDC, or any SPL token balance for any wallet address. (2) Jupiter swap quotes - get expected output amounts for token swaps via Jupiter aggregator. (3) Meteora swap quotes - get expected output amounts for Meteora dynamic bonding curve pools.
  
 */
export declare function subscribeAllCommonQueries(callback: (data: CommonQueriesResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/** Arguments accepted by the "solBalance" query on CommonQueries. */
interface CommonQueriesSolBalanceArgs {
    walletAddress: string;
}
/**
 * Runs the "solBalance" query on CommonQueries.
 * Description: Get SOL balance for a wallet address in lamports (1 SOL = 1,000,000,000 lamports). Pass walletAddress as parameter.
 * Query Logic: @TokenPlugin.getBalance(@newData.walletAddress, @constants.SOL)
 */
export declare function runSolBalanceQueryForCommonQueries(queryId: string, args: CommonQueriesSolBalanceArgs): Promise<number>;
/** Arguments accepted by the "usdcBalance" query on CommonQueries. */
interface CommonQueriesUsdcBalanceArgs {
    walletAddress: string;
}
/**
 * Runs the "usdcBalance" query on CommonQueries.
 * Description: Get USDC balance for a wallet address in base units (1 USDC = 1,000,000 base units with 6 decimals). Pass walletAddress as parameter.
 * Query Logic: @TokenPlugin.getBalance(@newData.walletAddress, @constants.USDC)
 */
export declare function runUsdcBalanceQueryForCommonQueries(queryId: string, args: CommonQueriesUsdcBalanceArgs): Promise<number>;
/** Arguments accepted by the "tokenBalance" query on CommonQueries. */
interface CommonQueriesTokenBalanceArgs {
    walletAddress: string;
    tokenMint: string;
}
/**
 * Runs the "tokenBalance" query on CommonQueries.
 * Description: Get balance for any SPL token mint for a wallet address. Pass walletAddress and tokenMint as parameters. Returns balance in the token's smallest units based on its decimals.
 * Query Logic: @TokenPlugin.getBalance(@newData.walletAddress, @newData.tokenMint)
 */
export declare function runTokenBalanceQueryForCommonQueries(queryId: string, args: CommonQueriesTokenBalanceArgs): Promise<number>;
/** Arguments accepted by the "jupiterSwapQuote" query on CommonQueries. */
interface CommonQueriesJupiterSwapQuoteArgs {
    inputMint: string;
    outputMint: string;
    amount: string;
}
/**
 * Runs the "jupiterSwapQuote" query on CommonQueries.
 * Description: Get a Jupiter swap quote for exchanging tokens. Pass inputMint (token to sell, use @constants.SOL for native SOL), outputMint (token to buy), and amount (in smallest units like lamports). Returns the expected output amount.
 * Query Logic: @DeFiPlugin.getSwapQuote(@newData.inputMint, @newData.outputMint, @newData.amount)
 */
export declare function runJupiterSwapQuoteQueryForCommonQueries(queryId: string, args: CommonQueriesJupiterSwapQuoteArgs): Promise<number>;
/** Arguments accepted by the "meteoraSwapQuote" query on CommonQueries. */
interface CommonQueriesMeteoraSwapQuoteArgs {
    tokenMintAddress: string;
    tokenToSwapInMintAddress: string;
    tokenAmount: string;
}
/**
 * Runs the "meteoraSwapQuote" query on CommonQueries.
 * Description: Get a Meteora dynamic bonding curve swap quote. Pass tokenMintAddress (the pool's base token), tokenToSwapInMintAddress (token to swap in, use @constants.SOL for native SOL), and tokenAmount (in smallest units). Returns the expected output amount.
 * Query Logic: @DeFiPlugin.getMeteoraSwapQuote(@newData.tokenMintAddress, @newData.tokenToSwapInMintAddress, @newData.tokenAmount)
 */
export declare function runMeteoraSwapQuoteQueryForCommonQueries(queryId: string, args: CommonQueriesMeteoraSwapQuoteArgs): Promise<number>;
export interface LotteryPotRequest {
    active: boolean;
}
export interface LotteryPotResponse {
    active: boolean;
    id: string;
    tarobase_created_at: number;
    tarobase_transaction_hash?: string | undefined;
}
/**
 * Build a LotteryPot operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildLotteryPot(potId: string, data?: LotteryPotRequest): DocumentOperation;
/**
 * Admin creates the lottery pot PDA once. The potId must match @constants.POT_ID. Creates the on-chain PDA account that holds SOL for prize payouts. (Create/Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the write worked.
 */
export declare function setLotteryPot(potId: string, data?: LotteryPotRequest): Promise<boolean>;
/**
 *
  Read Operation Details: Anyone can check the prize pot balance and status.
   (Get Single Item)
 */
export declare function getLotteryPot(potId: string): Promise<LotteryPotResponse | null>;
/**
 * Subscribes to changes in a single LotteryPot document. (
  Read Operation Details: Anyone can check the prize pot balance and status.
  )
 */
export declare function subscribeLotteryPot(callback: (data: LotteryPotResponse | null) => void, potId: string): Promise<() => Promise<void>>;
/**
 * Get many LotteryPot items from collection lotteryPot
 
  Read Operation Details: Anyone can check the prize pot balance and status.
  
 */
export declare function getManyLotteryPot(filter?: string): Promise<LotteryPotResponse[]>;
/**
 * Subscribe to changes in LotteryPot collection at lotteryPot
 
  Read Operation Details: Anyone can check the prize pot balance and status.
  
 */
export declare function subscribeManyLotteryPot(callback: (data: LotteryPotResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all LotteryPot items from collection lotteryPot
 
  Read Operation Details: Anyone can check the prize pot balance and status.
  
 */
export declare function getAllLotteryPot(filter?: string): Promise<LotteryPotResponse[]>;
/**
 * Subscribe to changes in LotteryPot collection at lotteryPot
 
  Read Operation Details: Anyone can check the prize pot balance and status.
  
 */
export declare function subscribeAllLotteryPot(callback: (data: LotteryPotResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/**
 * Runs the "getPotBalance" query on LotteryPot.
 * Query Logic: @TokenPlugin.getBalance(@constants.POT_ID, @constants.SOL)
 */
export declare function runGetPotBalanceQueryForLotteryPot(potId: string): Promise<number>;
export interface LotteryStateRequest {
    isActive: boolean;
    mainNumber: number | TimeOperation | IncrementOperation | TokenAmount;
    totalTickets: number | TimeOperation | IncrementOperation | TokenAmount;
    lastWinner?: AddressType;
    lastWinNumber?: number | TimeOperation | IncrementOperation | TokenAmount;
}
export interface LotteryStateResponse {
    isActive: boolean;
    mainNumber: number;
    totalTickets: number;
    lastWinner?: string;
    lastWinNumber?: number;
    id: string;
    tarobase_created_at: number;
    tarobase_transaction_hash?: string | undefined;
}
/**
 * Build a LotteryState operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildLotteryState(lotteryId: string, data: LotteryStateRequest): DocumentOperation;
/**
 * Any authenticated user can create a new lottery round and request VRF to generate the main number (range 0 to u64 max via @constants.MAX_NUMBER). The round starts inactive until the VRF reveal sets the mainNumber and activates it. (Create/Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the write worked.
 */
export declare function setLotteryState(lotteryId: string, data: LotteryStateRequest): Promise<boolean>;
export type LotteryStateRequestUpdate = Partial<LotteryStateRequest>;
/**
 * Build a LotteryState update operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildUpdateLotteryState(lotteryId: string, data: LotteryStateRequestUpdate): DocumentOperation;
/**
 * Admin only. Safety valve to manually deactivate a stuck round by setting isActive to false. Reveal hooks bypass rules via @DocumentPlugin.updateField and are unaffected by this rule. (Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the update worked.
 */
export declare function updateLotteryState(lotteryId: string, data: LotteryStateRequestUpdate): Promise<boolean>;
/**
 *
  Read Operation Details: Anyone can view the current lottery round state including whether it is active, the main number to beat, total tickets, and last winner.
   (Get Single Item)
 */
export declare function getLotteryState(lotteryId: string): Promise<LotteryStateResponse | null>;
/**
 * Subscribes to changes in a single LotteryState document. (
  Read Operation Details: Anyone can view the current lottery round state including whether it is active, the main number to beat, total tickets, and last winner.
  )
 */
export declare function subscribeLotteryState(callback: (data: LotteryStateResponse | null) => void, lotteryId: string): Promise<() => Promise<void>>;
/**
 * Get many LotteryState items from collection lotteryState
 
  Read Operation Details: Anyone can view the current lottery round state including whether it is active, the main number to beat, total tickets, and last winner.
  
 */
export declare function getManyLotteryState(filter?: string): Promise<LotteryStateResponse[]>;
/**
 * Subscribe to changes in LotteryState collection at lotteryState
 
  Read Operation Details: Anyone can view the current lottery round state including whether it is active, the main number to beat, total tickets, and last winner.
  
 */
export declare function subscribeManyLotteryState(callback: (data: LotteryStateResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all LotteryState items from collection lotteryState
 
  Read Operation Details: Anyone can view the current lottery round state including whether it is active, the main number to beat, total tickets, and last winner.
  
 */
export declare function getAllLotteryState(filter?: string): Promise<LotteryStateResponse[]>;
/**
 * Subscribe to changes in LotteryState collection at lotteryState
 
  Read Operation Details: Anyone can view the current lottery round state including whether it is active, the main number to beat, total tickets, and last winner.
  
 */
export declare function subscribeAllLotteryState(callback: (data: LotteryStateResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/**
 * Runs the "getMainNumber" query on LotteryState.
 * Query Logic: @OraclePlugin.getRandomNumber($lotteryId, 0, @constants.MAX_NUMBER)
 */
export declare function runGetMainNumberQueryForLotteryState(lotteryId: string): Promise<number>;
/**
 * Runs the "getVRFAddress" query on LotteryState.
 * Query Logic: @OraclePlugin.getVRFAddress($lotteryId)
 */
export declare function runGetVRFAddressQueryForLotteryState(lotteryId: string): Promise<string>;
export interface LotteryStateStartRevealsRequest {
}
export interface LotteryStateStartRevealsResponse {
    id: string;
    tarobase_created_at: number;
    tarobase_transaction_hash?: string | undefined;
}
/**
 * Build a LotteryStateStartReveals operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildLotteryStateStartReveals(lotteryId: string, revealId: string, data?: LotteryStateStartRevealsRequest): DocumentOperation;
/**
 * Oracle VRF callback. The revealId must match lotteryId. Reads the random number for this lotteryId (0 to u64 max via @constants.MAX_NUMBER), sets it as mainNumber on the lotteryState, and activates the round. Idempotent via || true pattern. (Create/Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the write worked.
 */
export declare function setLotteryStateStartReveals(lotteryId: string, revealId: string, data?: LotteryStateStartRevealsRequest): Promise<boolean>;
/**
 *
  Read Operation Details: Anyone can view reveal records (fieldless).
   (Get Single Item)
 */
export declare function getLotteryStateStartReveals(lotteryId: string, revealId: string): Promise<LotteryStateStartRevealsResponse | null>;
/**
 * Subscribes to changes in a single LotteryStateStartReveals document. (
  Read Operation Details: Anyone can view reveal records (fieldless).
  )
 */
export declare function subscribeLotteryStateStartReveals(callback: (data: LotteryStateStartRevealsResponse | null) => void, lotteryId: string, revealId: string): Promise<() => Promise<void>>;
/**
 * Get many LotteryStateStartReveals items from collection lotteryState/${lotteryId}/startReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function getManyLotteryStateStartReveals(lotteryId: string, filter?: string): Promise<LotteryStateStartRevealsResponse[]>;
/**
 * Subscribe to changes in LotteryStateStartReveals collection at lotteryState/${lotteryId}/startReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function subscribeManyLotteryStateStartReveals(callback: (data: LotteryStateStartRevealsResponse[]) => void, lotteryId: string, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all LotteryStateStartReveals items from collection lotteryState/${lotteryId}/startReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function getAllLotteryStateStartReveals(lotteryId: string, filter?: string): Promise<LotteryStateStartRevealsResponse[]>;
/**
 * Subscribe to changes in LotteryStateStartReveals collection at lotteryState/${lotteryId}/startReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function subscribeAllLotteryStateStartReveals(callback: (data: LotteryStateStartRevealsResponse[]) => void, lotteryId: string, filter?: string): Promise<() => Promise<void>>;
export interface LotteryStateTicketsRequest {
    buyer: AddressType;
    lotteryId: string;
    won?: boolean;
    winNumber?: number | TimeOperation | IncrementOperation | TokenAmount;
}
export interface LotteryStateTicketsResponse {
    buyer: string;
    lotteryId: string;
    won?: boolean;
    winNumber?: number;
    id: string;
    tarobase_created_at: number;
    tarobase_transaction_hash?: string | undefined;
}
/**
 * Build a LotteryStateTickets operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildLotteryStateTickets(lotteryId: string, ticketId: string, data?: LotteryStateTicketsRequest): DocumentOperation;
/**
 * Authenticated user buys a ticket for 0.01 SOL (10000000 lamports). Lottery must be active. Buyer must equal @user.address. SOL is transferred to the pot PDA via onchain hook. VRF randomness is requested for this ticket with u64 max range. The won and winNumber fields start null and are set by the reveal hook. (Create/Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the write worked.
 */
export declare function setLotteryStateTickets(lotteryId: string, ticketId: string, data?: LotteryStateTicketsRequest): Promise<boolean>;
/**
 *
  Read Operation Details: Anyone can view all tickets including buyer, won status, and winning number.
   (Get Single Item)
 */
export declare function getLotteryStateTickets(lotteryId: string, ticketId: string): Promise<LotteryStateTicketsResponse | null>;
/**
 * Subscribes to changes in a single LotteryStateTickets document. (
  Read Operation Details: Anyone can view all tickets including buyer, won status, and winning number.
  )
 */
export declare function subscribeLotteryStateTickets(callback: (data: LotteryStateTicketsResponse | null) => void, lotteryId: string, ticketId: string): Promise<() => Promise<void>>;
/**
 * Get many LotteryStateTickets items from collection lotteryState/${lotteryId}/tickets
 
  Read Operation Details: Anyone can view all tickets including buyer, won status, and winning number.
  
 */
export declare function getManyLotteryStateTickets(lotteryId: string, filter?: string): Promise<LotteryStateTicketsResponse[]>;
/**
 * Subscribe to changes in LotteryStateTickets collection at lotteryState/${lotteryId}/tickets
 
  Read Operation Details: Anyone can view all tickets including buyer, won status, and winning number.
  
 */
export declare function subscribeManyLotteryStateTickets(callback: (data: LotteryStateTicketsResponse[]) => void, lotteryId: string, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all LotteryStateTickets items from collection lotteryState/${lotteryId}/tickets
 
  Read Operation Details: Anyone can view all tickets including buyer, won status, and winning number.
  
 */
export declare function getAllLotteryStateTickets(lotteryId: string, filter?: string): Promise<LotteryStateTicketsResponse[]>;
/**
 * Subscribe to changes in LotteryStateTickets collection at lotteryState/${lotteryId}/tickets
 
  Read Operation Details: Anyone can view all tickets including buyer, won status, and winning number.
  
 */
export declare function subscribeAllLotteryStateTickets(callback: (data: LotteryStateTicketsResponse[]) => void, lotteryId: string, filter?: string): Promise<() => Promise<void>>;
/**
 * Runs the "getTicketNumber" query on LotteryStateTickets.
 * Query Logic: @OraclePlugin.getRandomNumber($ticketId, 0, @constants.MAX_NUMBER)
 */
export declare function runGetTicketNumberQueryForLotteryStateTickets(lotteryId: string, ticketId: string): Promise<number>;
/**
 * Runs the "getTicketVRFAddress" query on LotteryStateTickets.
 * Query Logic: @OraclePlugin.getVRFAddress($ticketId)
 */
export declare function runGetTicketVRFAddressQueryForLotteryStateTickets(lotteryId: string, ticketId: string): Promise<string>;
export interface LotteryStateTicketRevealsRequest {
}
export interface LotteryStateTicketRevealsResponse {
    id: string;
    tarobase_created_at: number;
    tarobase_transaction_hash?: string | undefined;
}
/**
 * Build a LotteryStateTicketReveals operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildLotteryStateTicketReveals(lotteryId: string, ticketId: string, data?: LotteryStateTicketRevealsRequest): DocumentOperation;
/**
 * Oracle VRF callback. Settlement logic: Reads ticket random number (0 to u64 max via @constants.MAX_NUMBER). If number > mainNumber, ticket wins - 99% of pot balance is transferred to buyer via @TokenPlugin.transfer from PDA using integer division (1% remains in pot as seed for next round), lottery deactivates, lastWinner and lastWinNumber are set on lotteryState. If number <= mainNumber, ticket is marked as lost and pot keeps growing. Uses get() for buyer field (immutable, set on ticket create). Idempotent via || true pattern and won == null guard. (Create/Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the write worked.
 */
export declare function setLotteryStateTicketReveals(lotteryId: string, ticketId: string, data?: LotteryStateTicketRevealsRequest): Promise<boolean>;
/**
 *
  Read Operation Details: Anyone can view reveal records (fieldless).
   (Get Single Item)
 */
export declare function getLotteryStateTicketReveals(lotteryId: string, ticketId: string): Promise<LotteryStateTicketRevealsResponse | null>;
/**
 * Subscribes to changes in a single LotteryStateTicketReveals document. (
  Read Operation Details: Anyone can view reveal records (fieldless).
  )
 */
export declare function subscribeLotteryStateTicketReveals(callback: (data: LotteryStateTicketRevealsResponse | null) => void, lotteryId: string, ticketId: string): Promise<() => Promise<void>>;
/**
 * Get many LotteryStateTicketReveals items from collection lotteryState/${lotteryId}/ticketReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function getManyLotteryStateTicketReveals(lotteryId: string, filter?: string): Promise<LotteryStateTicketRevealsResponse[]>;
/**
 * Subscribe to changes in LotteryStateTicketReveals collection at lotteryState/${lotteryId}/ticketReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function subscribeManyLotteryStateTicketReveals(callback: (data: LotteryStateTicketRevealsResponse[]) => void, lotteryId: string, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all LotteryStateTicketReveals items from collection lotteryState/${lotteryId}/ticketReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function getAllLotteryStateTicketReveals(lotteryId: string, filter?: string): Promise<LotteryStateTicketRevealsResponse[]>;
/**
 * Subscribe to changes in LotteryStateTicketReveals collection at lotteryState/${lotteryId}/ticketReveals
 
  Read Operation Details: Anyone can view reveal records (fieldless).
  
 */
export declare function subscribeAllLotteryStateTicketReveals(callback: (data: LotteryStateTicketRevealsResponse[]) => void, lotteryId: string, filter?: string): Promise<() => Promise<void>>;
export interface LotteryPotFundingRequest {
    amt: number | TimeOperation | IncrementOperation | TokenAmount;
}
export interface LotteryPotFundingResponse {
    amt: number;
    id: string;
    tarobase_created_at: number;
    tarobase_transaction_hash?: string | undefined;
}
/**
 * Build a LotteryPotFunding operation for use with setMany.
 * @returns A DocumentOperation that can be passed to setMany.
 */
export declare function buildLotteryPotFunding(fundingId: string, data?: LotteryPotFundingRequest): DocumentOperation;
/**
 * Admin only. Transfers the specified amount of SOL (in lamports) from admin wallet to the pot PDA via onchain hook. Used to seed or top up the prize pool. (Create/Update Single Item)
 * @returns A boolean indicating whether the operation succeeded (true) or failed (false). Always check this value to confirm the write worked.
 */
export declare function setLotteryPotFunding(fundingId: string, data?: LotteryPotFundingRequest): Promise<boolean>;
/**
 *
  Read Operation Details: Anyone can view funding history.
   (Get Single Item)
 */
export declare function getLotteryPotFunding(fundingId: string): Promise<LotteryPotFundingResponse | null>;
/**
 * Subscribes to changes in a single LotteryPotFunding document. (
  Read Operation Details: Anyone can view funding history.
  )
 */
export declare function subscribeLotteryPotFunding(callback: (data: LotteryPotFundingResponse | null) => void, fundingId: string): Promise<() => Promise<void>>;
/**
 * Get many LotteryPotFunding items from collection lotteryPotFunding
 
  Read Operation Details: Anyone can view funding history.
  
 */
export declare function getManyLotteryPotFunding(filter?: string): Promise<LotteryPotFundingResponse[]>;
/**
 * Subscribe to changes in LotteryPotFunding collection at lotteryPotFunding
 
  Read Operation Details: Anyone can view funding history.
  
 */
export declare function subscribeManyLotteryPotFunding(callback: (data: LotteryPotFundingResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
/**
 * Get all LotteryPotFunding items from collection lotteryPotFunding
 
  Read Operation Details: Anyone can view funding history.
  
 */
export declare function getAllLotteryPotFunding(filter?: string): Promise<LotteryPotFundingResponse[]>;
/**
 * Subscribe to changes in LotteryPotFunding collection at lotteryPotFunding
 
  Read Operation Details: Anyone can view funding history.
  
 */
export declare function subscribeAllLotteryPotFunding(callback: (data: LotteryPotFundingResponse[]) => void, filter?: string): Promise<() => Promise<void>>;
export {};
