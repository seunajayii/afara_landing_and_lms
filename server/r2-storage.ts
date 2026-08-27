import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "afara-storage";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error("R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.");
    }
    
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  
  const prefix = isPublic ? "public/" : "private/";
  const fullKey = `${prefix}${key}`;
  
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fullKey,
    Body: body,
    ContentType: contentType,
  }));
  
  const url = isPublic && R2_PUBLIC_URL 
    ? `${R2_PUBLIC_URL}/${fullKey}`
    : await getPresignedUrl(fullKey, 3600);
  
  return { key: fullKey, url };
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  
  return await getSignedUrl(client, command, { expiresIn });
}

export async function getFileStream(
  key: string,
  range?: string,
): Promise<{
  body: NodeJS.ReadableStream;
  contentLength?: number;
  contentType?: string;
  contentRange?: string;
  acceptRanges?: string;
}> {
  const client = getS3Client();
  const response = await client.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ...(range ? { Range: range } : {}),
  }));

  if (!response.Body) {
    throw new Error("The requested file has no readable body");
  }

  return {
    body: response.Body as NodeJS.ReadableStream,
    contentLength: response.ContentLength,
    contentType: response.ContentType,
    contentRange: response.ContentRange,
    acceptRanges: response.AcceptRanges,
  };
}

export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  
  await client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
}

export async function listFiles(prefix: string): Promise<string[]> {
  const client = getS3Client();
  
  const response = await client.send(new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
  }));
  
  return (response.Contents || []).map(obj => obj.Key!).filter(Boolean);
}

export async function downloadFile(key: string): Promise<Buffer> {
  const client = getS3Client();
  
  const response = await client.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
  
  const stream = response.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
