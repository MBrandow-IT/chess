import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "./components";

/**
 * Wrap every `<table>` in the rendered HAST in a div with
 * `class="prose-table-scroll"` so the table can scroll horizontally on
 * narrow viewports without making the page itself scroll.
 *
 * Doing this at the HAST layer (rather than overriding the `table`
 * component via the MDX components map) is more reliable: it depends only
 * on rehype, not on whether the runtime resolves lowercase HTML-element
 * overrides correctly.
 */
function rehypeWrapTables() {
  return (tree: unknown) => {
    type Node = {
      type?: string;
      tagName?: string;
      properties?: Record<string, unknown>;
      children?: Node[];
    };
    const walk = (node: Node) => {
      if (!node?.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child?.type === "element" && child.tagName === "table") {
          // Wrap the table in a scroll container.
          node.children[i] = {
            type: "element",
            tagName: "div",
            properties: { className: ["prose-table-scroll"] },
            children: [child],
          };
          // IMPORTANT: descend into the *original* table, NOT the new
          // wrapper. If we walked the wrapper we'd re-find the same
          // <table> as a direct child and wrap it again, blowing the
          // call stack with infinite re-wrapping.
          walk(child);
        } else {
          walk(child);
        }
      }
    };
    walk(tree as Node);
  };
}

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
 * stripped out as defense-in-depth.
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
        rehypePlugins: [rehypeWrapTables],
      },
    },
  });
  return content;
}
