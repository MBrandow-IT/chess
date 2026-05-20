import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string }>;
}) {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md rounded-xl border border-black/5 bg-white p-6 shadow-card">
        <h1 className="font-display text-2xl font-semibold">
          Instructor sign-in
        </h1>
        <p className="mt-1 text-sm text-buckeye-gray">
          We'll email you a one-time link. No password needed.
        </p>
        <div className="mt-6">
          <LoginForm searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}
