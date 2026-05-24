import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function createListingPhotoUploadUrl({
  userId,
  fileName,
  contentType,
}: {
  userId: string;
  fileName: string;
  contentType: string;
}) {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!client || !bucket || !publicBaseUrl) {
    return null;
  }

  const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-80);
  const key = `listings/${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return {
    key,
    uploadUrl: await getSignedUrl(client, command, { expiresIn: 300 }),
    publicUrl: `${publicBaseUrl.replace(/\/$/, "")}/${key}`,
  };
}
