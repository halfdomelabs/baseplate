# @baseplate-dev/sync

This package is the core synchronization engine for Baseplate's code generation workflow.

## Purpose

The sync package provides:

- Orchestration of the code generation pipeline
- Processing and execution of generator bundles in dependency order
- Task phase management for multi-stage code generation
- Dynamic task handling for data-driven generation
- Provider scope management for inter-task communication
- Git diff3 merge capabilities for integrating generated code

## Key Features

- Generator dependency resolution and execution
- Task-based architecture with run and build phases
- Provider system for sharing data between generators
- Code merging with existing codebases
- Error handling and recovery mechanisms

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and serves as the central engine for all code generation operations in Baseplate projects.
