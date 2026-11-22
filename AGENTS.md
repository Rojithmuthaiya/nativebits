# Repository Guidelines

## Project Structure

NativeBits is a TypeScript library of animated text components for React Native. Component implementations and their props live in `src/text/`, with one `.tsx` file per component. `src/index.ts` is the public entry point. Add named exports there for new public components and their prop types. `README.md` contains installation and usage examples. The library has no bundled app, test directory, or asset directory. `lib/` contains generated build output and is ignored by Git. Make source changes in `src/`.

## Build and Local Development

- `npm ci` installs dependencies from `package-lock.json` and runs the `prepare` build.
- `npm run typecheck` checks strict TypeScript types without emitting files.
- `npm run build` uses React Native Builder Bob to generate CommonJS, ES modules, and TypeScript declarations under `lib/`.

To run a component locally, import it from `nativebits-animated-text` in a consuming React Native app. Use `package.json` for peer dependency requirements and ensure the app configures Reanimated and Worklets.

## Coding Style and Naming

Use PascalCase for component filenames and matching props interfaces, such as `SplitText.tsx` and `SplitTextProps`. Use single quotes, semicolons, and the surrounding file's indentation. Most components use two spaces, while some Skia components use four. Keep formatting changes scoped to the code you edit. The package defines no lint or format script.

## Verification

The package has no automated test runner or coverage threshold. Run type checking and the build before submitting code changes. For animation changes, verify playback in a consuming app, including changed props, replay or looping where supported, and cleanup when the component unmounts.

## Commits and Pull Requests

Use a short imperative commit subject, such as `Fix TypewriterText cursor timing`. In the pull request, describe the behavior change and its verification, link any related issue, and include a short recording for visible animation changes.
