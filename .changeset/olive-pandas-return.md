---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Each app now carries its own public URL, and the backend reads them through `getApiUrl`, `getWebUrl` and `getWebOrigins`, so anything minting an absolute link names the client it means rather than declaring a URL setting of its own. `ALLOWED_ORIGINS` and `AUTH_FRONTEND_URL` are gone: set `API_URL` and a `WEB_URL_<APP>` per web app before upgrading, or the app will fail to start, plus `ADDITIONAL_WEB_ORIGINS` for any trusted origin that is not an app in the project.
