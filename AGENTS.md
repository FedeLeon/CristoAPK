# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# CristoAPK Architecture Instructions

This repository is the native mobile client for CristoApp.

## Product Boundary

- Build an Android mobile app with Expo, React Native, TypeScript, and Expo Router.
- Treat `/var/www/html/CristoApp` as an external Laravel JSON API only.
- Do not move Laravel code into this repo.
- Do not convert the Laravel web app into an APK.
- Do not use a WebView as the main solution. Screens must be native React Native screens.
- Keep backend route names, database tables, models, and Laravel contracts outside this repo unless the user explicitly asks to modify the backend.

## Main Stack

- Expo SDK 57.
- React Native.
- TypeScript with strict mode.
- Expo Router for navigation.
- Axios for HTTP requests.
- TanStack Query for server state, cache, loading states, errors, refetch, and invalidation.
- Expo SecureStore for authentication token persistence.
- Zod for validating important API responses at the app boundary.

## Directory Ownership

- `app/`: route screens and route layouts only.
- `app/_layout.tsx`: global providers and navigator setup.
- `src/api/`: API client and endpoint-specific API functions.
- `src/auth/`: token storage and future auth/session helpers.
- `src/types/`: API schemas and TypeScript types.
- Future shared UI should go in `src/components/`.
- Future hooks should go in `src/hooks/`.
- Future formatting or domain helpers should go in `src/lib/` or `src/utils/`, choosing one and staying consistent.

## Navigation Rules

- Use file-based routes under `app/`.
- Keep route files thin: they may compose UI and call hooks, but API details should stay in `src/api/`.
- Use Expo Router navigation helpers (`router`, `Link`, route params) instead of hand-rolled navigation state.
- Prefer adding a route that maps to the user's actual workflow, not a demo-only screen.

## API Rules

- Use `src/api/client.ts` as the only Axios instance.
- Use `EXPO_PUBLIC_API_URL` from `.env` for the API base URL.
- Attach the Bearer token only through the Axios request interceptor.
- On `401`, clear the local token and move the user back toward login in the screen/session layer.
- Every endpoint module should return already-normalized app data. Screens should not know whether Laravel returned `{ data: ... }` or a direct payload.
- Use Zod for login, user, course, Bible, and other important responses before trusting server data.
- Keep endpoint paths aligned with the backend contract:
  - `POST /api/login`
  - `GET /api/me`
  - `POST /api/logout`
  - `GET /api/cursos`
  - `GET /api/cursos/{id}`
  - `GET /api/biblia/versiones`
  - `GET /api/biblia/libros`
  - `GET /api/biblia/capitulos/{id}`

## Auth Rules

- Store only the API token in SecureStore under the existing `auth_token` key unless a migration is explicitly needed.
- Do not store passwords.
- Login flow:
  - `POST /api/login`.
  - Validate response with Zod.
  - Save token with SecureStore.
  - Invalidate auth-related queries.
  - Navigate to `/`.
- Logout flow:
  - Try `POST /api/logout`.
  - Always delete the local token in `finally`.
  - Invalidate cached queries.

## State Rules

- Use TanStack Query for API data.
- Do not duplicate server state into React `useState` unless the screen needs temporary editable form state.
- Use stable query keys such as `['me']`, `['courses']`, `['course', id]`, `['bible-books']`.
- After login/logout or mutations that change visible server data, invalidate the affected queries.

## UI Rules

- Keep the first screen as the usable app, not a landing page.
- Build compact, practical mobile screens for repeated use.
- Use native React Native components unless a library is already installed and appropriate.
- Use the MDS dove assets as the only app brand icon from now on:
  - source SVG files live in `assets/brand/mds-dove-black.svg` and `assets/brand/mds-dove-white.svg`;
  - generated PNG files live in `assets/brand/` and the Expo icon files in `assets/`;
  - run `npm run generate-brand-assets` after changing the source SVG files;
  - do not reintroduce the default Expo icon or a different logo.
- Keep visual style consistent with the current quiet, light, card-based mobile UI:
  - white surfaces,
  - light gray borders,
  - blue primary actions,
  - `8` border radius,
  - readable spacing.
- Every loading, empty, error, and retry state must be handled for API screens.
- Error messages shown to users should come from `getApiErrorMessage` or an equivalent shared helper.

## Local Development

- Backend local command:
  - `cd /var/www/html/CristoApp`
  - `php artisan serve --host=0.0.0.0 --port=8000`
- Mobile local command:
  - `cd /var/www/html/CristoAPK`
  - `npm start`
- Android emulator API URL:
  - `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api`
- Physical phone API URL:
  - `EXPO_PUBLIC_API_URL=http://<LOCAL_PC_IP>:8000/api`
- Restart Expo after changing `.env`.
- Node.js 20.19.4 or newer is recommended for this Expo/React Native version.

## Verification Before Finishing

- Run `npx tsc --noEmit` after TypeScript changes.
- Start or keep Expo running when the user needs to preview the app.
- If Expo fails with a Node engine warning or Metro issue, check the Node version first.
- Mention any backend endpoint that cannot be verified because the Laravel API is not implemented or not running.

## Future APK Build

- Use EAS when the app is ready for an Android build:
  - `npm install -g eas-cli`
  - `eas build:configure`
  - `eas build -p android --profile preview`
- Do not create native Android folders manually unless Expo prebuild or EAS requires it for a specific native dependency.
