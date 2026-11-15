// The profile and leaderboard designs group thousands with a dot: 2.440.
const numberFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 0,
});

export const formatNumber = (value: number): string =>
  numberFormat.format(value);
