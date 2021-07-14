declare module "fastmatter" {
  export interface FastMatter {
    attributes: Record<string, unknown>;
    body: string
  }
  export default function (arg: string): FastMatter;
}
