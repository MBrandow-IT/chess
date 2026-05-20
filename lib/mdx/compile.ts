import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponents } from "./components";

/**
 * Compile a raw MDX source string into a React element. Used by the lesson
 * page on the server to render authored .mdx files.
 */
export async function renderLessonMDX(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: [],
      },
    },
  });
  return content;
}
