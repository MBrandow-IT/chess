#!/usr/bin/env tsx
/**
 * scripts/sync-plans.ts
 *
 * Reads content/plans/<plan>/plan.yaml + each lesson.yaml and upserts the
 * metadata into Supabase. Run with:
 *
 *   npm run sync
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { listPlans, listLessons, lessonFolderName } from "@/lib/content";
import type { Database } from "@/lib/supabase/types";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const sb = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const plans = await listPlans();
  if (plans.length === 0) {
    console.log("No plans found under content/plans. Nothing to sync.");
    return;
  }

  for (const plan of plans) {
    process.stdout.write(`• ${plan.slug} ${plan.title} ... `);
    const { data: planRow, error: planErr } = await sb
      .from("lesson_plans")
      .upsert(
        {
          slug: plan.slug,
          title: plan.title,
          description: plan.description,
          age_group: plan.age_group ?? null,
          cover_image: plan.cover_image ?? null,
          order_idx: plan.order_idx ?? 0,
          published: plan.published ?? true,
        },
        { onConflict: "slug" },
      )
      .select("id, slug")
      .single();
    if (planErr || !planRow) {
      console.error("FAILED");
      console.error(planErr);
      process.exit(1);
    }

    const lessons = await listLessons(plan.slug);
    const desiredSlugs = new Set(lessons.map((l) => l.slug));

    for (const lesson of lessons) {
      const folder = await lessonFolderName(plan.slug, lesson.slug);
      const { error: lessonErr } = await sb.from("lessons").upsert(
        {
          plan_id: planRow.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          order_idx: lesson.order_idx,
          content_path: `content/plans/${plan.slug}/${folder ?? lesson.slug}/lesson.mdx`,
        },
        { onConflict: "plan_id,slug" },
      );
      if (lessonErr) {
        console.error("\n  lesson upsert failed:", lesson.slug, lessonErr);
        process.exit(1);
      }
    }

    // Drop lessons in the DB that no longer exist in the filesystem.
    const { data: existing } = await sb
      .from("lessons")
      .select("id, slug")
      .eq("plan_id", planRow.id);
    const stale = (existing ?? []).filter((l) => !desiredSlugs.has(l.slug));
    if (stale.length > 0) {
      const ids = stale.map((l) => l.id);
      const { error: delErr } = await sb.from("lessons").delete().in("id", ids);
      if (delErr) {
        console.error("\n  prune failed:", delErr);
        process.exit(1);
      }
    }

    console.log(
      `OK (${lessons.length} lessons${stale.length ? `, pruned ${stale.length}` : ""})`,
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
