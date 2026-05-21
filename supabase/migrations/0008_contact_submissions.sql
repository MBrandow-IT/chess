-- ---------------------------------------------------------------------
-- contact_submissions  (public contact form inbox; admin review only)
-- ---------------------------------------------------------------------

do $$ begin
  create type public.contact_category as enum (
    'advice',
    'tutoring',
    'admin_access',
    'bug_report'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  category   public.contact_category not null,
  name       text not null,
  email      text not null,
  message    text not null,
  page_url   text,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_email_created_at_idx
  on public.contact_submissions (lower(email), created_at desc);

alter table public.contact_submissions enable row level security;

drop policy if exists "admin read contact_submissions" on public.contact_submissions;
create policy "admin read contact_submissions" on public.contact_submissions
  for select using (public.is_admin());
