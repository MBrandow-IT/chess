/** Generates a random 6-digit PIN as a zero-padded string. */
export function generatePin(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, "0");
}
