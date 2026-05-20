import { createSupabaseServerClient } from "./server";

export type AppUser = {
  id: string;
  email: string | null;
  isAdmin: boolean;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;

  const role =
    (data.user.app_metadata as { role?: string } | null)?.role ?? null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAdmin: role === "admin",
  };
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(null, { status: 302, headers: { Location: "/admin/login" } });
  }
  if (!user.isAdmin) {
    throw new Response("Not authorized", { status: 403 });
  }
  return user;
}
