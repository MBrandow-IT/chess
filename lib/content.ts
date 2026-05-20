import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

export type PlanMeta = {
  slug: string;
  title: string;
  description: string;
  age_group?: string;
  cover_image?: string;
  order_idx?: number;
  published?: boolean;
  order: string[];
};

export type LessonMeta = {
  slug: string;
  title: string;
  summary: string;
  order_idx: number;
};

export type PlanWithCount = PlanMeta & { lessonCount: number };

export type LessonFile = {
  meta: LessonMeta;
  content: string;
  filepath: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content", "plans");

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readYaml<T>(filepath: string): Promise<T | null> {
  if (!(await pathExists(filepath))) return null;
  const raw = await fs.readFile(filepath, "utf8");
  return YAML.parse(raw) as T;
}

export async function listPlans(): Promise<PlanWithCount[]> {
  if (!(await pathExists(CONTENT_ROOT))) return [];

  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  const planDirs = entries.filter((e) => e.isDirectory());

  const plans: PlanWithCount[] = [];
  for (const dir of planDirs) {
    const planPath = path.join(CONTENT_ROOT, dir.name, "plan.yaml");
    const plan = await readYaml<PlanMeta>(planPath);
    if (!plan) continue;
    const lessons = await listLessons(plan.slug);
    plans.push({ ...plan, lessonCount: lessons.length });
  }

  return plans.sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
}

export async function getPlan(slug: string): Promise<PlanMeta | null> {
  const planPath = path.join(CONTENT_ROOT, slug, "plan.yaml");
  return readYaml<PlanMeta>(planPath);
}

export async function listLessons(planSlug: string): Promise<LessonMeta[]> {
  const planDir = path.join(CONTENT_ROOT, planSlug);
  if (!(await pathExists(planDir))) return [];

  const entries = await fs.readdir(planDir, { withFileTypes: true });
  const lessonDirs = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith("_"),
  );

  const lessons: LessonMeta[] = [];
  for (const dir of lessonDirs) {
    const lessonYaml = path.join(planDir, dir.name, "lesson.yaml");
    const meta = await readYaml<LessonMeta>(lessonYaml);
    if (meta) lessons.push(meta);
  }
  return lessons.sort((a, b) => a.order_idx - b.order_idx);
}

export async function getLessonFile(
  planSlug: string,
  lessonSlug: string,
): Promise<LessonFile | null> {
  const planDir = path.join(CONTENT_ROOT, planSlug);
  if (!(await pathExists(planDir))) return null;

  const entries = await fs.readdir(planDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const lessonYaml = path.join(planDir, entry.name, "lesson.yaml");
    const meta = await readYaml<LessonMeta>(lessonYaml);
    if (meta?.slug !== lessonSlug) continue;

    const mdxPath = path.join(planDir, entry.name, "lesson.mdx");
    if (!(await pathExists(mdxPath))) return null;
    const raw = await fs.readFile(mdxPath, "utf8");
    const { content, data } = matter(raw);
    return {
      meta: { ...meta, ...data },
      content,
      filepath: mdxPath,
    };
  }
  return null;
}

export async function listAllLessonsWithContent(
  planSlug: string,
): Promise<LessonFile[]> {
  const planDir = path.join(CONTENT_ROOT, planSlug);
  if (!(await pathExists(planDir))) return [];

  const entries = await fs.readdir(planDir, { withFileTypes: true });
  const out: LessonFile[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const lessonYaml = path.join(planDir, entry.name, "lesson.yaml");
    const meta = await readYaml<LessonMeta>(lessonYaml);
    if (!meta) continue;
    const mdxPath = path.join(planDir, entry.name, "lesson.mdx");
    if (!(await pathExists(mdxPath))) continue;
    const raw = await fs.readFile(mdxPath, "utf8");
    const { content } = matter(raw);
    out.push({ meta, content, filepath: mdxPath });
  }
  return out.sort((a, b) => a.meta.order_idx - b.meta.order_idx);
}
