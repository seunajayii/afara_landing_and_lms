export type NewsletterBlock =
  | { id: string; type: "text"; text: string }
  | {
      id: string;
      type: "image";
      url: string;
      alt: string;
      asset?: {
        key: string;
        filename: string;
        contentType: string;
        contentId: string;
      };
    }
  | { id: string; type: "button"; label: string; url: string }
  | { id: string; type: "divider" };

export type NewsletterSegment =
  | { type: "newsletter_subscribers" }
  | { type: "community_members" }
  | { type: "team_members" }
  | { type: "all_users" }
  | { type: "cohort_members"; cohortId: string }
  | { type: "applicants"; status: string; cohortId?: string };

export type NewsletterAudience = {
  segments: NewsletterSegment[];
  selectedUserIds: string[];
};

export const DEFAULT_NEWSLETTER_BLOCKS: NewsletterBlock[] = [
  { id: "intro", type: "text", text: "Hello there,\n\nWrite your message here." },
];

export const DEFAULT_NEWSLETTER_AUDIENCE: NewsletterAudience = {
  segments: [{ type: "newsletter_subscribers" }],
  selectedUserIds: [],
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value: string): string {
  const url = value.trim();
  if (/^(https?:\/\/|data:image\/|cid:|\/api\/newsletter\/assets\?key=)/i.test(url)) return escapeHtml(url);
  return "#";
}

export function renderNewsletterBlocks(blocks: NewsletterBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "text") {
      return `<tr><td style="padding:18px 32px;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#24352b;white-space:normal;">${escapeHtml(block.text).replace(/\n/g, "<br />")}</td></tr>`;
    }
    if (block.type === "image") {
      return `<tr><td style="padding:12px 32px;text-align:center;"><img src="${safeUrl(block.url)}" alt="${escapeHtml(block.alt || "Email image")}" style="display:block;max-width:100%;height:auto;margin:0 auto;border:0;" /></td></tr>`;
    }
    if (block.type === "button") {
      return `<tr><td style="padding:12px 32px 24px;text-align:center;"><a href="${safeUrl(block.url)}" style="display:inline-block;background:#075c2d;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 22px;font-family:Arial,sans-serif;font-weight:700;">${escapeHtml(block.label || "Learn more")}</a></td></tr>`;
    }
    return `<tr><td style="padding:12px 32px;"><hr style="border:0;border-top:1px solid #dce5dd;" /></td></tr>`;
  }).join("");
}

export function renderNewsletterHtml(subject: string, blocks: NewsletterBlock[]): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f3f6ef;padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dce5dd;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#075c2d;padding:28px 32px;text-align:center;"><div style="font-family:Georgia,serif;color:#ffffff;font-size:28px;font-weight:700;">AFÁRÁ</div><div style="font-family:Arial,sans-serif;color:#d9f1df;font-size:12px;margin-top:6px;letter-spacing:1px;">ACCELERATOR</div></td></tr>
      ${renderNewsletterBlocks(blocks)}
      <tr><td style="padding:20px 32px;border-top:1px solid #edf2ed;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b7c70;text-align:center;">AFÁRÁ is an initiative of Open Spaces &amp; Bridges Advisory (OPSB).</td></tr>
    </table>
  </body>
</html>`;
}