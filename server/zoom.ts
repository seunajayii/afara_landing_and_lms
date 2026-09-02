const ZOOM_OAUTH_TOKEN_URL = "https://zoom.us/oauth/token";

export interface ZoomRecordingDownloadInput {
  downloadUrl: string;
  downloadToken?: string | null;
}

export interface ZoomRecordingDownload {
  body: Buffer;
  contentType: string;
  fileSize: number;
}

function getErrorText(value: unknown): string {
  if (typeof value === "object" && value !== null && "message" in value) {
    return String((value as { message: unknown }).message);
  }
  return "Zoom request failed.";
}

function assertZoomDownloadUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Zoom returned an invalid recording download URL.");
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (hostname !== "zoom.us" && !hostname.endsWith(".zoom.us"))) {
    throw new Error("Zoom returned an untrusted recording download URL.");
  }
  return url;
}

async function getZoomAccessToken(): Promise<string> {
  // A short-lived token can be supplied by a deployment that manages Zoom
  // access outside of the server-to-server OAuth flow.
  if (process.env.ZOOM_ACCESS_TOKEN) return process.env.ZOOM_ACCESS_TOKEN;

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  if (!clientId || !clientSecret || !accountId) {
    throw new Error("Zoom recording download credentials are not configured.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(
    `${ZOOM_OAUTH_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Zoom access token request failed (${response.status}).`);
  }
  const body = await response.json() as { access_token?: unknown };
  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new Error("Zoom did not return an access token.");
  }
  return body.access_token;
}

export async function downloadZoomRecording(
  input: ZoomRecordingDownloadInput,
): Promise<ZoomRecordingDownload> {
  const url = assertZoomDownloadUrl(input.downloadUrl);
  const token = input.downloadToken || await getZoomAccessToken();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "video/mp4,application/octet-stream",
    },
  });
  if (!response.ok) {
    throw new Error(`Zoom recording download failed (${response.status}).`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type")?.split(";")[0].trim() || "video/mp4";
  return {
    body,
    contentType: contentType.startsWith("video/") ? contentType : "video/mp4",
    fileSize: body.length,
  };
}