// Platform commission ("merchant of record" model): the platform collects each
// ticket payment and keeps a percentage as its fee; the rest is the organizer's
// earnings. Configure the rate via PLATFORM_FEE_PERCENT (defaults to 10%).

export const PLATFORM_FEE_PERCENT = (() => {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT);
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 10;
})();

/** The platform's commission on a gross ticket amount (rounded to whole units). */
export function calcPlatformFee(amount: number): number {
  if (amount <= 0) return 0;
  return Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
}

/** What the organizer earns from a gross ticket amount, after the platform fee. */
export function calcOrganizerEarnings(amount: number): number {
  return amount - calcPlatformFee(amount);
}
