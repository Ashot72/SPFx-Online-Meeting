export const setBackgroundColor = (
  { theme: { siteVariables } },
): { backgroundColor: string } => ({
  backgroundColor: siteVariables.colorScheme.default.background3,
});

export const setIconForeColor = (
  { theme: { siteVariables } },
): { color: string } => ({
  color: siteVariables.colorScheme.brand.foreground,
});
