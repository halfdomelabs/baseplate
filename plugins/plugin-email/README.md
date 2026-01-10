# @baseplate-dev/plugin-email

Email plugin for Baseplate applications. Provides email sending capabilities through various email service providers.

## Features

- Queue-based asynchronous email delivery
- Support for multiple email providers (Postmark, SendGrid, etc.)
- Type-safe email configuration
- Attachment support
- Custom headers support

## Plugins

### email (Spec Plugin)

The base email plugin that defines the email interface and provides the core email service. Requires an implementation plugin to be selected.

### postmark (Implementation Plugin)

Postmark email delivery implementation using the Postmark API.

## Usage

1. Enable the `email` plugin in your project
2. Select an implementation (e.g., `postmark`)
3. Configure the required environment variables

### Environment Variables

#### Email (Base)

- `EMAIL_DEFAULT_FROM` - Default sender email address

#### Postmark

- `POSTMARK_SERVER_TOKEN` - Postmark API server token

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and extends Baseplate projects with email sending functionality.
