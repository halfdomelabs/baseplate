---
'@baseplate-dev/fastify-generators': patch
---

Replace custom Date/DateTime/UUID scalars with graphql-scalars package and add JSON/JSONObject scalar support

This change migrates from custom scalar implementations to the well-maintained graphql-scalars package, providing:

- **Reduced maintenance burden**: No custom scalar code to maintain
- **Battle-tested implementations**: Comprehensive edge case handling from widely-used library
- **Standards compliance**: RFC 3339 compliant Date/DateTime handling
- **Better error messages**: Detailed validation error messages out of the box
- **Additional scalars**: JSON and JSONObject scalars now available

**Breaking Changes:**

- Date scalar now uses RFC 3339 format (stricter than previous YYYY-MM-DD regex)
- DateTime scalar automatically shifts non-UTC timezones to UTC
- UUID scalar has more comprehensive validation

**New Features:**

- JSON scalar for any valid JSON value (objects, arrays, primitives, null)
- JSONObject scalar for JSON objects only (rejects arrays and primitives)

**Dependencies:**

- Added graphql-scalars@1.23.0 to generated backend packages
