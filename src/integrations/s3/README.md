# Direct-to-S3 (local dev)

This repo includes `.env.local.storage` (git-ignored) with AWS credentials and bucket info for local development.

Recommended client approach:
- Generate pre-signed URLs on your backend for uploads/downloads.
- Or, in trusted local scripts, use the AWS SDK directly.

Example using AWS SDK v3 (Node/SSR or trusted tool):

```ts path=null start=null
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.S3_REGION_NAME,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  endpoint: process.env.S3_ENDPOINT || undefined,
});

export async function uploadObject({ Bucket, Key, Body, ContentType }: { Bucket: string; Key: string; Body: Buffer | Uint8Array | string; ContentType?: string }) {
  await s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
}
```

In the browser, do not embed raw AWS secrets. Use your backend to mint pre-signed URLs (or run in a trusted local script).