import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login?next=/host");
  }
  if (!user.isAdmin) {
    return (
      <div className="container-page py-12">
        <h1 className="font-display text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-buckeye-gray">
          Signed in as <strong>{user.email}</strong>, but this account isn't
          an instructor admin. Ask the site owner to run{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            npm run make-admin -- {user.email}
          </code>
          .
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="focus-ring rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/host"
            className="font-display text-base font-semibold text-buckeye-ink hover:underline"
          >
            Instructor dashboard
          </Link>
          <span className="text-buckeye-gray">·</span>
          <Link href="/host/events" className="text-buckeye-gray hover:underline">
            Events
          </Link>
          <span className="text-buckeye-gray">·</span>
          <span className="text-buckeye-gray">{user.email}</span>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
          >
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
