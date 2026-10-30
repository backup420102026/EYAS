/** Small deterministic string hash (integer math only, so server and browser agree). */
export function hashString(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return h;
}
