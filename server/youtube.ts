import { ReplitConnectors } from "@replit/connectors-sdk";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export type YouTubePrivacyStatus = "public" | "unlisted" | "private";

export interface YouTubeVideoMetadata {
  videoId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  privacyStatus: string | null;
  uploadStatus: string | null;
}

interface UploadVideoInput {
  file: Buffer;
  contentType: string;
  title: string;
  description?: string;
  privacyStatus: YouTubePrivacyStatus;
}

export function parseYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const candidate = url.pathname.split("/").filter(Boolean)[0];
      return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const queryId = url.searchParams.get("v");
      if (queryId && YOUTUBE_ID_PATTERN.test(queryId)) return queryId;

      const pathParts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(pathParts[0] || "")) {
        const candidate = pathParts[1];
        return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function parseDurationSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function getThumbnailUrl(snippet: Record<string, any> | undefined): string | null {
  const thumbnails = snippet?.thumbnails;
  return thumbnails?.maxres?.url
    || thumbnails?.standard?.url
    || thumbnails?.high?.url
    || thumbnails?.medium?.url
    || thumbnails?.default?.url
    || null;
}

async function getYouTubeError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // Use the generic message below if YouTube did not return JSON.
  }
  return text || "YouTube could not complete this request.";
}

function toMetadata(video: Record<string, any>): YouTubeVideoMetadata {
  const snippet = video.snippet as Record<string, any> | undefined;
  const contentDetails = video.contentDetails as Record<string, any> | undefined;
  const status = video.status as Record<string, any> | undefined;

  return {
    videoId: String(video.id),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    title: String(snippet?.title || "Untitled video"),
    description: String(snippet?.description || ""),
    thumbnailUrl: getThumbnailUrl(snippet),
    durationSeconds: parseDurationSeconds(contentDetails?.duration),
    privacyStatus: typeof status?.privacyStatus === "string" ? status.privacyStatus : null,
    uploadStatus: typeof status?.uploadStatus === "string" ? status.uploadStatus : null,
  };
}

export async function getYouTubeVideo(videoId: string): Promise<YouTubeVideoMetadata | null> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy(
    "youtube",
    `/youtube/v3/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(videoId)}`,
  );

  if (!response.ok) {
    throw new Error(await getYouTubeError(response));
  }

  const body = await response.json() as { items?: Record<string, any>[] };
  const video = body.items?.[0];
  return video ? toMetadata(video) : null;
}

export async function uploadYouTubeVideo(input: UploadVideoInput): Promise<YouTubeVideoMetadata> {
  const boundary = `replit-youtube-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({
    snippet: {
      title: input.title,
      description: input.description || "",
      categoryId: "27",
    },
    status: {
      privacyStatus: input.privacyStatus,
    },
  });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${input.contentType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`),
    input.file,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const connectors = new ReplitConnectors();
  const response = await connectors.proxy(
    "youtube",
    "/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(await getYouTubeError(response));
  }

  const uploaded = toMetadata(await response.json() as Record<string, any>);
  return (await getYouTubeVideo(uploaded.videoId)) || uploaded;
}