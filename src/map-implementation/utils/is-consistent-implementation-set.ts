import { Implementation } from "../types";

export function isConsistentImplementationSet(
  implementations: Implementation[]
): boolean {
  if (implementations.length === 0) {
    return false;
  }

  // Assume all implementations have the same URLs.
  //  Something's very wrong if that isn't the case
  const expectedFails = implementations[0].findings.filter(
    ({ expected }) => expected === "failed"
  );

  return expectedFails.every(({ url }) => {
    return implementations.some((implementation) =>
      failedUrl(implementation, url)
    );
  });
}

function failedUrl({ findings }: Implementation, url: string): boolean {
  const finding = findings.find((finding) => finding.url === url);
  return finding ? ["failed", "cantTell"].includes(finding.actual) : false;
}
