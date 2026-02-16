export function getTtlSeconds(): number {
  const raw = process.env.RISK_SCORE_TTL_SECONDS;
  const parsed = raw ? Number(raw) : 3600;
  if (!Number.isFinite(parsed) || parsed <= 0) return 3600;
  return Math.floor(parsed);
}

export function computeExpiresAt(computedAt: Date): Date {
  const ttlSec = getTtlSeconds();
  return new Date(computedAt.getTime() + ttlSec * 1000);
}