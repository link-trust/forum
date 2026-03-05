# AGENTS.md

## Purpose
- This file guides coding agents working in `link-trust-forum`.
- Focus on Astro 4 static forum app conventions and workflows.
- Keep changes small, readable, and consistent with existing patterns.

## Repository Snapshot
- Runtime: Node.js with npm scripts.
- Framework: Astro + Node adapter (`astro`, `@astrojs/node`).
- Output mode: server (`output: 'server'` in `astro.config.mjs`).
- Main source directories:
  - `src/layouts/`
  - `src/lib/`
  - `src/pages/`
  - `public/`
- Current language/content mix: UI copy in Chinese, code in English.
- No dedicated lint or test framework is currently configured.

## Instruction Precedence
- Follow direct user instructions first.
- Then follow repository rule files (if they exist).
- Then follow this `AGENTS.md`.
- Then infer from existing local code style.

## Cursor and Copilot Rules (checked)
- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.
- If any of these files are added later, treat them as required and update this file.

## Setup and Common Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Alternate dev alias: `npm run start`
- Build production site: `npm run build`
- Preview built site locally: `npm run preview`
- Run Astro CLI subcommands: `npm run astro -- <subcommand>`

## Lint, Typecheck, and Validation
- No explicit `lint` script exists in `package.json`.
- No ESLint or Prettier config files are currently present.
- Recommended structural/type check: `npm run astro -- check`
- When `astro check` is introduced into CI, keep it green before merge.
- If adding lint tooling, add scripts instead of relying on ad-hoc commands.

## Test Commands (current state)
- No `test` script exists in `package.json`.
- No test framework config (`vitest`, `jest`, `playwright`, etc.) exists.
- Result: there is no runnable project test suite yet.
- If asked to "run tests", report that tests are not configured and run `npm run build` as a minimum validation.

## Running a Single Test (important)
- Current repo status: not available, because no test runner is configured.
- If Vitest is added later, use:
  - Run one file: `npm run test -- src/path/to/file.test.ts`
  - Run one test name: `npm run test -- -t "test name"`
- If Jest is added later, use:
  - Run one file: `npm test -- src/path/to/file.test.ts`
  - Run one test name: `npm test -- -t "test name"`
- Keep this section updated when a real test stack is introduced.

## Architecture and File Placement
- Keep route pages under `src/pages/` (Astro file-based routing).
- Keep shared layouts under `src/layouts/`.
- Keep static assets in `public/`.
- Prefer creating reusable components in `src/components/` if page markup grows.
- Do not place generated build artifacts in source directories.

## Astro and Component Conventions
- Use Astro frontmatter (`---`) for imports, props, and server-side logic.
- Define explicit prop types with `interface Props`.
- Read props from `Astro.props` and destructure once near the top.
- Keep page templates declarative; move heavy logic out of markup.
- Use semantic HTML (`main`, `section`, `nav`, `article`) where possible.
- Keep layout-wide global styles in layout files only.
- Prefer scoped component/page styles in local `<style>` blocks.

## Imports and Dependency Rules
- Order imports: external packages first, then local relative imports.
- Use one import statement per module.
- Keep imports minimal; remove unused imports immediately.
- Use explicit file extensions for Astro component imports (for example `.astro`) to match existing code.
- Avoid deep relative paths when a simpler structure is possible.
- Do not introduce new dependencies without clear need.

## Formatting Rules
- Match existing formatting by file type:
  - `.astro`: tabs are currently used for indentation.
  - `.json` and `.mjs`: two spaces.
- Use semicolons in JavaScript/TypeScript contexts.
- Use single quotes in JS/TS where practical (matches current files).
- Keep trailing commas for multiline objects/arrays.
- Avoid unnecessary blank lines; keep sections visually grouped.
- Do not reformat unrelated files in style-only sweeps unless requested.

## TypeScript and Typing Guidance
- Prefer explicit interfaces/types for component props.
- Avoid `any`; use unions, literals, or generics when needed.
- Mark optional fields with `?` and handle undefined paths explicitly.
- Keep type declarations close to use unless shared broadly.
- For shared types, create a dedicated type module instead of duplicating.

## Naming Conventions
- Astro layout/component filenames: `PascalCase.astro`.
- Route filenames and folders: lowercase and URL-friendly.
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` when truly constant.
- CSS classes: `kebab-case`.
- Use descriptive names tied to forum domain concepts.

## CSS and UI Styling
- Prefer component-scoped styles by default.
- Use CSS variables for shared colors/spacing once repetition starts.
- Keep color contrast accessible.
- Avoid repeating magic numbers; extract tokens when reused.
- Keep hover and focus states for interactive elements.
- Ensure responsive behavior for mobile and desktop widths.

## Error Handling and Resilience
- Validate required props and critical data before rendering.
- For async data loading, use `try/catch` and render a safe fallback state.
- Do not swallow errors silently; provide context in logs/messages.
- Prefer user-friendly error text over raw exception dumps.
- Fail fast on configuration issues during build time.

## Accessibility and Content
- Provide meaningful heading hierarchy (`h1` -> `h2` -> ...).
- Ensure links and buttons have clear labels.
- Preserve `lang` and metadata patterns from the shared layout.
- Keep Chinese UI copy consistent in tone and terminology.
- Avoid emoji-only labels; pair with text for clarity.

## Agent Workflow Expectations
- Before editing, read related files and follow local patterns.
- Make the smallest change that fully solves the task.
- After code changes, run at least `npm run build` when feasible.
- If a requested command is unavailable, state why and provide the nearest valid check.
- Update this file when project tooling or conventions materially change.

## Quick Pre-PR Checklist
- Code compiles/builds: `npm run build`
- No unused imports or dead code introduced.
- New files are placed in correct directories.
- Styling remains responsive and accessible.
- Documentation/scripts updated when tooling changes.

## Security and Secrets
- Never commit secrets such as `.env` files, tokens, or private keys.
- Use placeholder/example values in docs and code snippets.
- Avoid logging sensitive identifiers in runtime output.

## Definition of Done
- Requested change is implemented with a minimal, reviewable diff.
- Validation completed via `npm run build` (or clearly explain why it was skipped).
- Relevant docs (`AGENTS.md`, `README.md`, scripts) are updated when workflow changes.
