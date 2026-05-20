#!/usr/bin/env tsx
/**
 * scripts/make-admin.ts
 *
 * Marks a Supabase user as an instructor admin by setting
 * `app_metadata.role = 'admin'`. The instructor magic-link login flow
 * automatically creates the auth.users row on first sign-in; run this script
 * once after your first login to grant yourself host privileges.
 *
 * Usage:
 *   npm run make-admin -- you@example.com
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1) ensure the user exists; if not, invite them (will receive magic link)
  let userId: string | null = null;

  // listUsers is paginated; loop until we find the email or exhaust pages
  for (let page = 1; page < 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      userId = found.id;
      break;
    }
    if (!data.users.length || data.users.length < 200) break;
  }

  if (!userId) {
    console.log(`No user with email ${email} yet. Inviting them...`);
    const { data, error } = await sb.auth.admin.inviteUserByEmail(email);
    if (error) throw error;
    userId = data.user?.id ?? null;
    if (!userId) throw new Error("Invite succeeded but no user id returned");
  }

  // 2) set app_metadata.role = 'admin'
  const { error } = await sb.auth.admin.updateUserById(userId, {
    app_metadata: { role: "admin" },
  });
  if (error) throw error;

  console.log(`OK — ${email} (${userId}) is now an admin.`);
  console.log("They may need to sign in again for the JWT to refresh.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
