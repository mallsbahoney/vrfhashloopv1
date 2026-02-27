import { set, transformValues, Address } from '@/lib/db-client';
import { AddressType } from '@/lib/db-client';

/**
 * Buys a lottery ticket by calling set() directly so errors are propagated
 * rather than swallowed (the generated setLotteryStateTickets catches and returns false).
 */
export async function buyTicketWithError(
  lotteryId: string,
  ticketId: string,
  data: { buyer: AddressType; lotteryId: string }
): Promise<void> {
  const transformedData = transformValues(data);
  const succeeded = await set(
    `lotteryState/${lotteryId}/tickets/${ticketId}`,
    transformedData
  );
  if (!succeeded) {
    throw new Error('Transaction returned false — purchase did not complete.');
  }
}

/**
 * Checks if an error message indicates an insufficient balance / funds problem.
 */
export function isInsufficientFundsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('insufficient') ||
    lower.includes('balance') ||
    lower.includes('funds') ||
    lower.includes('lamports')
  );
}
