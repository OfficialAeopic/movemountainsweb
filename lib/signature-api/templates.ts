// Location-to-template mapping per blueprint section "Templates Per Location".
// Each location has a different liability waiver referencing its property
// management company. Template IDs come from env so they can be rotated
// without a code change.

export type LocationSlug =
  | "easton_park"
  | "whisper_valley"
  | "wolf_ranch"
  | "goodnight_ranch";

export const LOCATION_SLUGS: LocationSlug[] = [
  "easton_park",
  "whisper_valley",
  "wolf_ranch",
  "goodnight_ranch",
];

const FALLBACK_TEMPLATES: Record<LocationSlug, string> = {
  easton_park: "tpl_easton_park",
  whisper_valley: "tpl_whisper_valley",
  wolf_ranch: "tpl_wolf_ranch",
  goodnight_ranch: "tpl_goodnight_ranch",
};

const ENV_KEYS: Record<LocationSlug, string> = {
  easton_park: "SIGNATURE_TEMPLATE_EASTON_PARK",
  whisper_valley: "SIGNATURE_TEMPLATE_WHISPER_VALLEY",
  wolf_ranch: "SIGNATURE_TEMPLATE_WOLF_RANCH",
  goodnight_ranch: "SIGNATURE_TEMPLATE_GOODNIGHT_RANCH",
};

export function getTemplateIdForLocation(loc: LocationSlug): string {
  const envKey = ENV_KEYS[loc];
  return process.env[envKey] ?? FALLBACK_TEMPLATES[loc];
}

export function normalizeLocationSlug(input: string): LocationSlug | null {
  const lower = input.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((LOCATION_SLUGS as string[]).includes(lower)) return lower as LocationSlug;
  // Loose matchers in case the caller passes display names.
  if (lower.includes("easton")) return "easton_park";
  if (lower.includes("whisper")) return "whisper_valley";
  if (lower.includes("wolf")) return "wolf_ranch";
  if (lower.includes("goodnight")) return "goodnight_ranch";
  return null;
}
