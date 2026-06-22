# Workstream: <name>

workstream_id: <kebab-case-id>

status: draft

stage: 3-准备开发

## Purpose

Describe the product requirement, user flow, or technical preparation this workstream covers.

## Inputs

- product requirements:
- interface design:
- technical plan:
- architecture decisions:

## Allowed Paths

- docs/**
- TODO.md

## Blocked Paths

- app/**
- apps/**
- src/**
- packages/**

## TODO Slices

- [ ] Define the smallest first slice.
- [ ] Define verification for that slice.

## Verification

- `node scripts/check-stage-gate.mjs`

## Exit Criteria

- The workstream is small enough to implement as one or more reviewable slices.
- Allowed paths and blocked paths are explicit.
- Verification commands are known.
