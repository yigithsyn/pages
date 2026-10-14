import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";

const processor = unified().use(remarkParse).use(remarkHtml);

export function markdownToHtml(text) {
    return String(processor.processSync(text));
}
