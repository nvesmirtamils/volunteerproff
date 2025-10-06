export function getLike(id: number): boolean {
  try {
    const key = `vp_like_${id}`;
    return localStorage.getItem(key) === "1";
  } catch { return false; }
}

export function toggleLike(id: number): boolean {
  try {
    const key = `vp_like_${id}`;
    const now = !(localStorage.getItem(key) === "1");
    localStorage.setItem(key, now ? "1" : "0");
    return now;
  } catch { return false; }
}

export type CommentItem = { at: number; text: string };

export function getComments(id: number): CommentItem[] {
  try {
    const raw = localStorage.getItem(`vp_comments_${id}`);
    return raw ? JSON.parse(raw) as CommentItem[] : [];
  } catch { return []; }
}

export function addComment(id: number, text: string): CommentItem[] {
  const items = getComments(id);
  const item: CommentItem = { at: Date.now(), text };
  items.unshift(item);
  try {
    localStorage.setItem(`vp_comments_${id}`, JSON.stringify(items));
  } catch {}
  return items;
}




