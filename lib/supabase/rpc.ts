/**
 * Typed wrapper around supabase-js `.rpc()` that doesn't run into the
 * `Args extends ... = never` inference bug. Use this instead of `sb.rpc(...)`
 * directly for our app's RPCs.
 */
import type { Database } from "./types";

type Fns = Database["public"]["Functions"];

/**
 * Typed wrapper that bypasses the supabase-js v2.10x rpc inference bug where
 * `Args extends ... = never` collapses to `undefined`. We cast the call
 * internally and re-narrow with our own Database types so callers get
 * typed args and return shapes.
 */
export async function callRpc<K extends keyof Fns>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: { rpc: any },
  name: K,
  args: Fns[K]["Args"],
) {
  const { data, error } = await sb.rpc(name, args);
  return {
    data: (data ?? null) as Fns[K]["Returns"] | null,
    error: error as { message: string } | null,
  };
}
