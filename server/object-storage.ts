import { Client } from "@replit/object-storage";
import { Readable } from "node:stream";

const PRIVATE_VIDEO_PREFIX = "private/resources/private-videos/";

let client: Client | null = null;
let availability: boolean | null = null;

export function isObjectStorageConfigured(): boolean {
  // Replit's SDK discovers the default bucket from the app environment. The
  // bucket may still be unavailable until Object Storage is provisioned, so
  // callers must use isObjectStorageAvailable before background sweeps.
  return Boolean(process.env.REPLIT_ENVIRONMENT || process.env.REPLIT_DEPLOYMENT || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID);
}

export async function isObjectStorageAvailable(): Promise<boolean> {
  if (!isObjectStorageConfigured()) return false;
  if (availability !== null) return availability;

  try {
    const result = await getClient().list({ maxResults: 1 });
    availability = result.ok;
  } catch {
    availability = false;
  }
  return availability;
}

function getClient(): Client {
  if (!client) {
    client = new Client();
  }
  return client;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Object storage request failed.";
}

function toPrivateObjectName(key: string): string {
  return key.startsWith("private/") ? key : `private/${key}`;
}

export async function uploadPrivateVideo(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ key: string }> {
  const objectName = toPrivateObjectName(key);
  const result = await getClient().uploadFromBytes(objectName, body, { compress: false });
  if (!result.ok) throw new Error(getErrorMessage(result.error));
  return { key: objectName };
}

export async function getObjectStorageFileStream(
  key: string,
  range?: string,
): Promise<{
  body: NodeJS.ReadableStream;
  contentLength?: number;
  contentType?: string;
  contentRange?: string;
  acceptRanges?: string;
}> {
  const objectName = key;
  const storageClient = getClient();

  if (!range) {
    const exists = await storageClient.exists(objectName);
    if (!exists.ok) throw new Error(getErrorMessage(exists.error));
    if (!exists.value) {
      const error = new Error("Video file not found");
      error.name = "NoSuchKey";
      throw error;
    }
    return {
      body: storageClient.downloadAsStream(objectName, { decompress: false }),
      acceptRanges: "bytes",
    };
  }

  const downloaded = await storageClient.downloadAsBytes(objectName, { decompress: false });
  if (!downloaded.ok) throw new Error(getErrorMessage(downloaded.error));
  const [contents] = downloaded.value;
  const totalBytes = contents.length;
  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || totalBytes === 0) {
    const error = new Error("Requested video range is not satisfiable");
    error.name = "InvalidRange";
    throw error;
  }

  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;
  const start = requestedStart === null
    ? Math.max(totalBytes - (requestedEnd || 0), 0)
    : requestedStart;
  const end = requestedEnd === null
    ? totalBytes - 1
    : Math.min(requestedEnd, totalBytes - 1);

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= totalBytes) {
    const error = new Error("Requested video range is not satisfiable");
    error.name = "InvalidRange";
    throw error;
  }

  const chunk = contents.subarray(start, end + 1);
  return {
    body: Readable.from([chunk]),
    contentLength: chunk.length,
    contentRange: `bytes ${start}-${end}/${totalBytes}`,
    acceptRanges: "bytes",
  };
}

export async function deleteObjectStorageFile(key: string): Promise<void> {
  const result = await getClient().delete(key, { ignoreNotFound: true });
  if (!result.ok) throw new Error(getErrorMessage(result.error));
}

export async function listObjectStoragePrivateVideoFiles(): Promise<string[]> {
  const result = await getClient().list({ prefix: PRIVATE_VIDEO_PREFIX, maxResults: 1000 });
  if (!result.ok) throw new Error(getErrorMessage(result.error));
  return result.value.map((object) => object.name);
}