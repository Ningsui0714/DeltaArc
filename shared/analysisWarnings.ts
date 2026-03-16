const internalAnalysisWarningPatterns = [
  /JSON required one(?: local)? repair pass after the initial parse failed\.$/i,
  /timed out on the reasoning model and fell back to /i,
  /returned no usable content on the reasoning model and fell back to /i,
  /^Dossier verifier selected .+ candidate:/i,
  /^Action brief verifier selected .+ candidate:/i,
  /\b(?:dossier|action brief) candidate failed:/i,
  /^Dossier candidate verifier failed:/i,
  /^Action brief verifier failed:/i,
  /^Fell back to .+ (?:dossier|action brief) candidate based on local ranking\.$/i,
  /^dossier split pipeline failed and fell back to the legacy single-pass dossier path\.$/i,
] as const;

function normalizeWarning(warning: string) {
  return warning.trim();
}

export function isInternalAnalysisWarning(warning: string) {
  const normalized = normalizeWarning(warning);

  return (
    normalized.length > 0 &&
    internalAnalysisWarningPatterns.some((pattern) => pattern.test(normalized))
  );
}

export function filterVisibleAnalysisWarnings(warnings: string[]) {
  const visible: string[] = [];

  warnings.forEach((warning) => {
    const normalized = normalizeWarning(warning);

    if (!normalized || isInternalAnalysisWarning(normalized) || visible.includes(normalized)) {
      return;
    }

    visible.push(normalized);
  });

  return visible;
}

export function withVisibleAnalysisWarnings<T extends { warnings: string[] }>(value: T): T {
  const warnings = filterVisibleAnalysisWarnings(value.warnings);

  if (
    warnings.length === value.warnings.length &&
    warnings.every((warning, index) => warning === value.warnings[index]?.trim())
  ) {
    return value;
  }

  return {
    ...value,
    warnings,
  };
}
