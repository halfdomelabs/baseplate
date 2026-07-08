# @baseplate-dev/plugin-notifications

Native notification engine plugin for Baseplate.

Provides a first-party, in-app + email notification system built on the
generated app's existing database, queue, and real-time (SSE) infrastructure.
The implementation sits behind a generic `NotificationService` contract so the
underlying engine can be swapped for a managed provider in the future without
refactoring consumers.

## Features (MVP)

- Typed `NotificationService` contract consumed via the request service context
- Schema-agnostic, polymorphic notification payloads (JSON, no domain foreign keys)
- Code-defined notification types via a `defineNotificationType()` registry
- Paginated feed, unread count, and state-management (mark read / delete) API
- Real-time broadcast of new notifications over SSE
- Ready-to-use `NotificationBell` and `NotificationFeed` React components

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and extends Baseplate projects
with a native notification system.
