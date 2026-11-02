// The profile design groups thousands with a dot: 2.440.
const profileNumberFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 0,
});

export const formatProfileNumber = (value: number): string =>
  profileNumberFormat.format(value);
