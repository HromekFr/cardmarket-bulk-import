export function buildPageUrl(idExpansion: number, page: number): string {
  const base = `?idExpansion=${idExpansion}&sortBy=number`;
  return page === 1 ? base : `${base}&site=${page}`;
}
