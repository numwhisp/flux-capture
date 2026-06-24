import type { FrictionType } from "./types";

/**
 * Lightweight regex/keyword classifier that buckets free-text feedback into
 * Usability / Value / Admin friction. Stand-in for an LLM call — runs
 * instantly client-side and stays deterministic. Returns null when no signal.
 */
export function classifyFreeText(text: string): FrictionType | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  const usability = /(setup|set up|configur|integrat|connect|onboard|confus|complicated|stuck|broke|broken|error|bug|can'?t find|how do i|docs?|tutorial|ux|ui|workflow)/;
  const value = /(roi|value|worth|number|metric|prove|justif|result|outcome|impact|baseline|qbr|exec|report|insight|moved the needle|what changed|didn'?t know what it did)/;
  const admin = /(seat|team|adopt|price|cost|discount|procure|invoice|sso|security|contract|budget|approval|finance|legal|renew|billing|plan)/;
  const scores: Record<FrictionType, number> = {
    usability: (t.match(usability) || []).length,
    value: (t.match(value) || []).length,
    admin: (t.match(admin) || []).length,
  };
  const top = (Object.entries(scores) as [FrictionType, number][])
    .sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : null;
}