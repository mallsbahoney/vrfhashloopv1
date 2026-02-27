import { TimeOperation, IncrementOperation, TokenAmount, DocumentOperation } from '../db-client';
/**
 * Admin seeds the prize pot with additional SOL
 */
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
