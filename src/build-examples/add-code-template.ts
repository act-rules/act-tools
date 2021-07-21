import outdent from 'outdent';
import { indent } from '../utils/indent'

export function addCodeTemplate(code: string, lang: string, title: string): string {
  if (['html', 'xhtml'].includes(lang) === false) {
    return code;
  }
  if (/<!doctype/i.test(code)) {
    return code;
  }

  const doctype = `<!DOCTYPE html${
    lang !== 'xhtml' ? '' : ' PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"'
  }>`

  if (/<html/i.test(code)) {
    return `${doctype}\n${code}`;
  }

  return htmlTemplate(doctype, title, code);
}

export const htmlTemplate = (doctype: string, title: string, code: string): string => {
  return outdent`
    ${doctype}
    <html lang="en">
    <head>
    \t<title>${title}</title>
    </head>
    <body>
    ${indent(code, '\t', 1)}
    </body>
    </html>
  `;
}
