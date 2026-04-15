export function getArticleRows(): string[] {
  const nodes = document.querySelectorAll('div[id^="articleRow"]');
  return Array.from(nodes).map((el) => el.id);
}
