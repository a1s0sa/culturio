export interface HistoricalDateRange { earliest: number | null; latest: number | null; uncertain: boolean; }

export function parseHistoricalDate(value: string | null | undefined): HistoricalDateRange {
  if (!value?.trim()) return { earliest: null, latest: null, uncertain: true };
  const text = value.trim();
  const uncertain = /circa|ca\.|c\.|about|probably|possibly|early|mid|late|century/i.test(text);
  const isBce = /\b(?:BCE|BC)\b/i.test(text);
  const years = [...text.matchAll(/(?<!\d)(\d{1,4})(?!\d)/g)].map((match) => Number(match[1]));
  if (/century/i.test(text) && years[0]) {
    const end = years[0] * 100;
    return isBce
      ? { earliest: -end, latest: -(end - 99), uncertain: true }
      : { earliest: end - 99, latest: end, uncertain: true };
  }
  if (!years.length) return { earliest: null, latest: null, uncertain: true };
  const signed = years.map((year) => isBce ? -year : year).sort((a, b) => a - b);
  return { earliest: signed[0] ?? null, latest: signed.at(-1) ?? null, uncertain };
}
