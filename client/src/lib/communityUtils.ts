import type { PostAttachment } from "@shared/schema";

export function parseAttachment(json: string | null | undefined): PostAttachment | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as PostAttachment;
  } catch {
    return null;
  }
}
