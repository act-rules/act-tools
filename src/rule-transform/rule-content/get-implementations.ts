export const getImplementations = (
  _: unknown,
  _1: unknown,
  options: Record<string, boolean | undefined>
): string => {
  const type = options?.proposed ? `proposed` : `approved`;
  return options.matrix
    ? `{% include_relative _implementation-${type}.md %}`
    : "";
};
