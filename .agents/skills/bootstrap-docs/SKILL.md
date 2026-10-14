---
name: bootstrap-docs
description: "Use when answering Bootstrap questions or implementing Bootstrap layouts, components, utilities, Sass, JavaScript, installation, or migration. Consult the locally vendored official LLM-readable Bootstrap documentation for authoritative details."
---

# Bootstrap Documentation

Use the bundled official Bootstrap documentation as a reference when working with Bootstrap in this repository.

## Reference

- [Full LLM-readable Bootstrap documentation](./references/llms-full.txt), downloaded from https://getbootstrap.com/llms-full.txt.

## Workflow

1. Check the project's `package.json` and installed Bootstrap version before applying version-specific guidance.
2. Search the bundled documentation for the relevant API or component instead of loading the entire file into context.
3. Confirm that guidance applies to the installed version; the docs describe Bootstrap 6, and project dependencies may change independently.
4. When the bundled docs do not cover the question or may be stale, consult the official Bootstrap documentation online and prefer the version matching the project.
