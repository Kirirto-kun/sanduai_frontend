export const MASTERCLASS_HISTORY_PAGE_SIZE = 30;
export type HistoryPage<T> = { items: T[]; total: number };

export function nextHistoryOffset<T>(lastPage: HistoryPage<T>, lastOffset: number): number | undefined {
  const offset = lastOffset + lastPage.items.length;
  return lastPage.items.length > 0 && offset < lastPage.total ? offset : undefined;
}

export function uniqueHistoryItems<T extends { id: string }>(pages: readonly HistoryPage<T>[]): T[] {
  const ids = new Set<string>();
  return pages.flatMap(page => page.items.filter(item => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  }));
}
