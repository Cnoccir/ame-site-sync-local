# s3-presign Edge Function

Generates AWS S3 pre-signed URLs for GET/PUT. Reads credentials from environment variables set as Supabase function secrets.

Environment variables (server-only):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_BUCKET_NAME
- S3_REGION_NAME
- Optional: S3_ENDPOINT (for non-AWS S3) and S3_FORCE_PATH_STYLE=true

Request (JSON):
```json
{
  "method": "PUT",   // or "GET"
  "key": "uploads/example.jpg",
  "expiresIn": 900,   // seconds (<= 604800), optional
  "bucket": "override-bucket" // optional override
}
```

Response:
```json
{
  "url": "https://...",
  "method": "PUT",
  "headers": {}
}
```

CORS is enabled using functions/_shared/cors.ts.