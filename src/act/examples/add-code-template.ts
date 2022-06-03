import outdent from "outdent";
import { indent } from "../../utils/indent";

const htmlDoctype = "<!DOCTYPE html>";
const xhtmlDoctype =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';

export function addCodeTemplate(
  code: string,
  lang: string,
  title: string,
  assetsBase = "/WAI/content-assets/wcag-act-rules"
): string {
  if (assetsBase) {
    code = code
      .replace(/"\/test-assets\//g, `"${assetsBase}/test-assets/`)
      .replace(/'\/test-assets\//g, `'${assetsBase}/test-assets/`)
      .replace(/url\(\/test-assets\//g, `url(${assetsBase}/test-assets/`);
  }

  if (["html", "xhtml"].includes(lang) === false) {
    return code;
  }
  if (/<!doctype/i.test(code)) {
    return code;
  }

  const doctype = lang === "html" ? htmlDoctype : xhtmlDoctype;
  if (/<html/i.test(code)) {
    return `${doctype}\n${code}`;
  }

  return htmlTemplate(doctype, title, code);
}

export const htmlTemplate = (
  doctype: string,
  title: string,
  code: string
): string => {
  return outdent`
    ${doctype}
    <html lang="en">
    <head>
    \t<title>${title}</title>
    </head>
    <body>
    ${indent(code, "\t", 1)}
    </body>
    </html>
  `;
};
