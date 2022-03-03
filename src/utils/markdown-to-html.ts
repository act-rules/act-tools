import unified from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

export function markdownToHtml(markdown: string): string {
  const processor = unified()
    //  Use "as any" to avoid build problems; This is fine.
    .use(remarkParse as any)
    .use(remarkRehype as any)
    .use(rehypeStringify as any);

  return String(processor.processSync(markdown));
}
