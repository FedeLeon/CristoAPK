# CristoAPK

APK Android de CristoApp creada con Expo, React Native, TypeScript, Expo Router, Axios, TanStack Query, Expo SecureStore y Zod.

Laravel se consume como API externa. Este proyecto no convierte Laravel en APK y no usa WebView como solucion principal.

## Requisitos

- Node.js 20.19.4 o superior recomendado.
- npm.
- Expo Go en el celular, o Android Studio con un emulador Android.
- Backend Laravel corriendo y exponiendo endpoints JSON en `/api`.

## Configuracion

El archivo `.env` define la URL base:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

Para emulador Android, usar:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

Para celular fisico, reemplazar por la IP local de la PC:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api
```

Cuando cambies `.env`, reinicia Expo para que tome el nuevo valor.

## Ejecutar backend Laravel local

En otra terminal:

```bash
cd /var/www/html/CristoApp
php artisan serve --host=0.0.0.0 --port=8000
```

## Ejecutar la app mobile

En este repo:

```bash
cd /var/www/html/CristoAPK
npm start
```

Luego:

- Presiona `a` para abrir en emulador Android.
- Escanea el QR con Expo Go para abrir en celular fisico.
- Guarda cambios en archivos `.tsx` y Expo refresca la pantalla automaticamente.

## Como ver el impacto de lo que vas haciendo

1. Deja corriendo Laravel con `php artisan serve --host=0.0.0.0 --port=8000`.
2. Deja corriendo Expo con `npm start`.
3. Abri la app en Expo Go o emulador.
4. Edita una pantalla en `app/` o un servicio en `src/api/`.
5. Guarda el archivo. Metro Bundler recompila y la app se actualiza sola.
6. Si cambias `.env`, corta Expo con `Ctrl+C` y vuelve a ejecutar `npm start`.
7. Si cambias dependencias nativas, vuelve a ejecutar `npx expo install ...` y reinicia la app.

## Pantallas iniciales

- `/` consulta token local y llama a `GET /api/me`.
- `/login` llama a `POST /api/login` y guarda el token en SecureStore.
- `/cursos` llama a `GET /api/cursos`.
- `/cursos/[id]` llama a `GET /api/cursos/{id}`.
- `/biblia` llama a `GET /api/biblia/versiones` y `GET /api/biblia/libros`.

## Endpoints esperados

- `POST /api/login`
- `GET /api/me`
- `POST /api/logout`
- `GET /api/cursos`
- `GET /api/cursos/{id}`
- `GET /api/biblia/versiones`
- `GET /api/biblia/libros`
- `GET /api/biblia/capitulos/{id}`

Los endpoints autenticados deben responder JSON y usar:

```http
Authorization: Bearer TOKEN_SANCTUM
Accept: application/json
Content-Type: application/json
```

## Generar APK mas adelante

```bash
npm install -g eas-cli
eas build:configure
eas build -p android --profile preview
```
