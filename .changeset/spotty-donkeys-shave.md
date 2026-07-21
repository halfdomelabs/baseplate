---
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/react-generators': patch
---

File categories can now restrict accepted file types via an "Allowed File Types" setting in the project builder, supporting individual MIME types and groups. The backend blocks uploads of disallowed types and the upload UI filters the file picker and shows clear, extension-based error messages. Validation is lightweight, and client errors are shown on failure rather than server errors.
