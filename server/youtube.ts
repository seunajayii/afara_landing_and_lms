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

export interface YouTubeResumableUploadInput {
  fileSize: number;
  contentType: string;
  title: string;
  description?: string;
  privacyStatus: YouTubePrivacyStatus;
}

export interface YouTubeUploadChunkResult {
  status: "uploading" | "completed";
  nextByte: number;
  video?: YouTubeVideoMetadata;
}

function getResumableUploadPath(location: string): string {
  try {
    const url = new URL(location);
    return `${url.pathname}${url.search}`;
  } catch {
    if (location.startsWith("/")) return location;
    throw new Error("YouTube returned an invalid resumable upload location.");
  }
}

function getNextByteFromRange(range: string | null): number {
  if (!range) return 0;
  const match = range.match(/^bytes=0-(\d+)$/);
  if (!match) throw new Error("YouTube returned an invalid upload progress range.");
  return Number(match[1]) + 1;
}

function getUploadMetadata(input: YouTubeResumableUploadInput): string {
  return JSON.stringify({
    snippet: {
      title: input.title,
      description: input.description || "",
      categoryId: "27",
    },
    status: {
      privacyStatus: input.privacyStatus,
    },
  });
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

export async function startYouTubeResumableUpload(
  input: YouTubeResumableUploadInput,
): Promise<string> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy(
    "youtube",
    "/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(input.fileSize),
        "X-Upload-Content-Type": input.contentType,
      },
      body: getUploadMetadata(input),
    },
  );

  if (!response.ok) {
    throw new Error(await getYouTubeError(response));
  }

  const location = response.headers.get("location");
  if (!location) throw new Error("YouTube did not return a resumable upload session.");
  return getResumableUploadPath(location);
}

export async function uploadYouTubeChunk(input: {
  sessionPath: string;
  chunk: Buffer;
  startByte: number;
  totalBytes: number;
  contentType: string;
}): Promise<YouTubeUploadChunkResult> {
  const endByte = input.startByte + input.chunk.length - 1;
  if (input.chunk.length === 0 || endByte >= input.totalBytes) {
    throw new Error("The YouTube upload chunk is outside the expected file range.");
  }

  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("youtube", input.sessionPath, {
    method: "PUT",
    headers: {
      "Content-Type": input.contentType,
      "Content-Length": String(input.chunk.length),
      "Content-Range": `bytes ${input.startByte}-${endByte}/${input.totalBytes}`,
    },
    body: input.chunk,
  });

  if (response.status === 308) {
    return {
      status: "uploading",
      nextByte: getNextByteFromRange(response.headers.get("range")),
    };
  }

  if (!response.ok) {
    throw new Error(await getYouTubeError(response));
  }

  const uploaded = toMetadata(await response.json() as Record<string, any>);
  return {
    status: "completed",
    nextByte: input.totalBytes,
    video: (await getYouTubeVideo(uploaded.videoId)) || uploaded,
  };
}

export async function getYouTubeUploadStatus(input: {
  sessionPath: string;
  totalBytes: number;
}): Promise<YouTubeUploadChunkResult> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("youtube", input.sessionPath, {
    method: "PUT",
    headers: {
      "Content-Length": "0",
      "Content-Range": `bytes */${input.totalBytes}`,
    },
  });

  if (response.status === 308) {
    return {
      status: "uploading",
      nextByte: getNextByteFromRange(response.headers.get("range")),
    };
  }

  if (!response.ok) {
    throw new Error(await getYouTubeError(response));
  }

  const uploaded = toMetadata(await response.json() as Record<string, any>);
  return {
    status: "completed",
    nextByte: input.totalBytes,
    video: (await getYouTubeVideo(uploaded.videoId)) || uploaded,
  };
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