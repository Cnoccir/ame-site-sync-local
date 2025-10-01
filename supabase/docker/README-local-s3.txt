Local S3 for Supabase Storage (self-hosted)

Hosted Supabase cannot be configured to store files in your own S3 bucket. The S3 protocol setting enables a compatible API but files still live in Supabase-managed storage.

For local self-hosted development, the storage-api container can be pointed at your AWS S3 bucket with environment variables. The Supabase CLI does not yet provide a simple switch; the recommended path is to start the stack and then recreate the storage-api service with S3 env, or maintain a docker-compose override and bring the stack up with it.

We keep credentials in .env.local.storage (git-ignored).

Required env for storage-api:
  STORAGE_BACKEND=s3
  STORAGE_S3_BUCKET=${S3_BUCKET_NAME}
  STORAGE_S3_REGION=${S3_REGION_NAME}
  STORAGE_S3_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
  STORAGE_S3_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
  STORAGE_S3_FORCE_PATH_STYLE=${S3_FORCE_PATH_STYLE}
  # STORAGE_S3_ENDPOINT=${S3_ENDPOINT}  # leave empty for AWS

Manual one-off (advanced):
1) Stop current storage container:
   docker stop $(docker ps -q --filter ancestor=public.ecr.aws/supabase/storage-api)
2) Start a replacement container attached to the same network with the above env. This is advanced and easy to misconfigure; prefer an override.

Safer option: keep local on-disk storage; use these S3 settings only in self-hosted production or via an override you explicitly run.