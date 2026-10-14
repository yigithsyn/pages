---
name: bootstrap
description: "Use when building, editing, or debugging Bootstrap layouts, components, utilities, or responsive behavior in this project. Check the installed Bootstrap version before relying on APIs or examples."
---

# Bootstrap in This Project

Use this skill for Bootstrap-related changes to the project's HTML, CSS, and JavaScript.

## Project Setup

- Bootstrap is installed as an npm dependency. Check `package.json` and the installed package version before using version-specific APIs.
- The current dependency is Bootstrap `6.0.0-alpha.1`; treat it as an alpha release, not as stable Bootstrap 5.
- For authoritative API and component guidance, use the `bootstrap-docs` skill and search its locally bundled official LLM-readable docs. Verify that guidance matches the installed package version.
- The HTML template loads assets from `node_modules/bootstrap/dist/`. Reuse that local setup unless the task explicitly calls for a different delivery method.
- Do not assume Bootstrap 5 examples or migration guidance apply unchanged. Verify component markup, class names, data attributes, and JavaScript APIs against the installed version.

## Workflow

1. Read the target HTML and nearby project files before changing markup or assets.
2. Confirm the installed Bootstrap version from `package.json` and, when needed, `node_modules/bootstrap/package.json`.
3. Prefer Bootstrap's existing grid, utilities, and components over custom CSS or JavaScript when they meet the design requirement.
4. Include Bootstrap JavaScript only for interactive components that need it; use the bundle when Popper-backed components are needed.
5. Keep the document semantic and accessible: use appropriate elements, labels, keyboard-operable controls, visible focus states, and ARIA only where needed.
6. Check responsive behavior at relevant viewport sizes and verify interactive behavior for any changed component.
7. Run the project's available validation commands. If no relevant checks exist, say so rather than treating an unverified change as tested.

## Guardrails

- Do not upgrade Bootstrap or add another UI framework unless explicitly requested.
- Do not invent or copy version-specific Bootstrap APIs without confirming they exist in the installed release.
- Keep changes focused; avoid adding custom CSS that duplicates an existing Bootstrap utility or component.
