# @baseplate-dev/project-builder-common

This package provides a single, convenient import point for all default Baseplate generators and plugins.

## Purpose

The project-builder-common package serves as a centralized export hub that bundles:

- Core generators (@baseplate-dev/core-generators)
- Fastify generators (@baseplate-dev/fastify-generators)
- React generators (@baseplate-dev/react-generators)
- Authentication plugin (@baseplate-dev/plugin-auth)
- Storage plugin (@baseplate-dev/plugin-storage)

## Usage

Instead of importing each generator and plugin individually, you can import everything from this single package:

```javascript
import { generators, plugins } from '@baseplate-dev/project-builder-common';
```

This simplifies dependency management and ensures all core Baseplate functionality is available with a single import.

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and acts as the main entry point for accessing Baseplate's default generators and plugins.
