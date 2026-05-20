import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  getServiceRoleKey,
} from "./env";
import type { Database } from "./types";

/** Server-side Supabase client respecting the user's auth cookie (RSC / route handlers). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        toSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll called from a Server Component; ignore – middleware refreshes the session.
        }
      },
    },
  });
}

/**
 * Privileged service-role client. Bypasses RLS. Use ONLY in server-only code
 * paths (route handlers, scripts) — never in a client component.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(SUPABASE_URL, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
