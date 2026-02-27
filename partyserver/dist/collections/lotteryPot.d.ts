import { DocumentOperation } from '../db-client';
/**
 * Prize pool escrow PDA that holds all ticket purchase SOL
 */
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
