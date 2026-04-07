export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export function matchesSearchQuery(values: Array<string | number | undefined | null>, search?: string) {
  if (!search?.trim()) {
    return true;
  }

  const query = normalizeSearchText(search);
  return values
    .filter((value) => value !== undefined && value !== null)
    .some((value) => String(value).toLowerCase().includes(query));
}
