import { TimeOperation, IncrementOperation, TokenAmount, AddressType, DocumentOperation } from '../db-client';
/**
 * Current lottery round state - tracks active status, main number to beat, tickets count, and last winner
 */
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
/**
 * VRF reveal callback for starting the lottery - sets the main number and activates the round
 */
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
/**
 * Individual ticket purchase - each ticket costs 0.01 SOL and generates a VRF random number
 */
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
/**
 * VRF reveal callback for ticket settlement - determines if ticket wins by comparing random number to mainNumber
 */
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
