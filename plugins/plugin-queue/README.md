# @baseplate-dev/plugin-queue

This plugin provides background job processing and task queue capabilities for Baseplate projects.

## Purpose

The plugin-queue package provides:

- Multiple queue implementation strategies (pg-boss, BullMQ, etc.)
- Background job processing with retry logic
- Job scheduling and cron-like repeatable jobs
- Queue monitoring and management interfaces
- Type-safe job definitions and handlers
- Concurrency control and job prioritization

## Features

- **pg-boss Integration**: PostgreSQL-based queue implementation for reliable job processing
- **Queue Management**: Define and manage multiple queues with different configurations
- **Job Options**: Configure retry attempts, backoff strategies, and concurrency limits
- **Type Safety**: Full TypeScript support for job data and handlers
- **Extensible**: Support for multiple queue backend implementations

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and extends Baseplate projects with comprehensive background job processing functionality.
