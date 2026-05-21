import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "./components";

/**
 * Compile a raw MDX source string into a React element. Used by the lesson
 * page on the server to render authored .mdx files.
 *
 * Lessons live in-repo under `content/plans/**` and are written by us, so we
 * opt-in to JavaScript expressions (which next-mdx-remote@6 blocks by default
 * for safety against untrusted MDX). This is what lets prop syntax like
 * `solution={["exd5"]}` or `correctChoice={2}` survive compilation.
 *
 * `blockDangerousJS` stays at its default (`true`) so a stray attempt at
 * `eval`, `Function`, `process`, or `require` inside MDX will still be
 * stripped out as defence-in-depth.
 */
export async function renderLessonMDX(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      blockJS: false,
      mdxOptions: {
        // GFM extends standard markdown with tables, strikethrough, task lists,
        // and autolinks — lesson authors expect those to "just work".
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
      },
    },
  });
  return content;
}
