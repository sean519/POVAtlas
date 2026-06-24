/**
 * Build a flag image URL from a lowercase ISO 3166-1 alpha-2 code using the
 * free flagcdn.com service. SVG scales crisply at any size, and the service
 * also supports UK constituent nations (e.g. "gb-eng", "gb-sct").
 */
export function flagUrl(iso2: string): string {
  return `https://flagcdn.com/${iso2}.svg`;
}
