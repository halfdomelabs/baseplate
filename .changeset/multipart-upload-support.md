---
'@baseplate-dev/plugin-storage': patch
---

Add multipart upload support with progress tracking using @aws-sdk/lib-storage

- Added @aws-sdk/lib-storage dependency for improved file upload handling
- Updated UploadFileOptions interface to support progress callbacks, partSize, and queueSize configuration
- Replaced PutObjectCommand with Upload class in S3 adapter for automatic optimization between single-part and multipart uploads
- Added UploadProgress interface for tracking upload progress with loaded bytes, total bytes, and percentage
