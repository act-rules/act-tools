import { outdent } from "outdent";

export function getTableOfContent(): string {
  return outdent`
    {::options toc_levels="2" /}
    {::nomarkdown}
    {% include toc.html type="start" title="Page Contents" %}
    {:/}
    {:toc}
    {::nomarkdown}
    {% include toc.html type="end" %}
    {:/}
  `;
}
