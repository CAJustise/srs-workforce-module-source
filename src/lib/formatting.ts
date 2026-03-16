const toNormalizedPrice = (value: unknown) => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const numericSource = raw.replace(/[^0-9.-]/g, '');
  const numericValue = Number(numericSource);
  if (!numericSource || Number.isNaN(numericValue)) {
    return raw.startsWith('$') ? raw : `$${raw}`;
  }

  const hasDecimals = numericSource.includes('.');
  return `$${numericValue.toFixed(hasDecimals ? 2 : 0)}`;
};

export const formatUsdPrice = (value: unknown) => toNormalizedPrice(value);

export const formatPerPersonPrice = (value: unknown) => {
  const price = toNormalizedPrice(value);
  if (!price) return null;
  return `${price} per person`;
};

export const formatPersonMinimum = (value: unknown) => {
  const minimum = Number(value);
  if (!Number.isFinite(minimum) || minimum <= 1) return null;
  return `${minimum} person minimum`;
};
