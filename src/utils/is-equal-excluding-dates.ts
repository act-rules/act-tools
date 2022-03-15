const dateRegex = /\d\d?\s\w+\s20\d{2}/g;

export function isEqualExcludingDates(strA: string, strB: string): boolean {
  const noDatesStrA = strA.replace(dateRegex, "");
  const noDatesStrB = strB.replace(dateRegex, "");
  return noDatesStrA === noDatesStrB;
}
