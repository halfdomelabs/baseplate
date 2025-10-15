---
'@baseplate-dev/plugin-storage': patch
---

Add automatic multipart upload support using @aws-sdk/lib-storage

- Added @aws-sdk/lib-storage dependency for improved file upload handling
- Replaced PutObjectCommand with Upload class in S3 adapter
- The Upload class automatically optimizes between single-part and multipart uploads based on file size
- No configuration changes required - existing upload code continues to work without modifications
