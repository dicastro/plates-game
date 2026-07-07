# Paso 1 — Google Cloud Console (una sola vez):

1. Crear proyecto (si no existe) en https://console.cloud.google.com
1. "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth client ID" > tipo Web application
1. "Authorized redirect URIs" — añadir las tres:
    * http://localhost:8787/auth/google/callback (dev local con wrangler dev)
    * https://staging.plates-worker.workers.dev/auth/google/callback (ajustar si el dominio real difiere)
    * https://plates-worker.workers.dev/auth/google/callback (ajustar al dominio de producción real)
1. Guardar Client ID y Client Secret — se usan en el paso 4.

# Paso 2 — Instalar dependencias del Worker:

```
cd worker
npm install
```

# Paso 3 — Crear las bases D1 (staging y producción):

```
npm exec wrangler -- d1 create plates-db-staging
npm exec wrangler -- d1 create plates-db-production
```

# Paso 4 — Aplicar el schema a cada D1:

```
npm exec wrangler -- d1 execute plates-db-staging --file ./src/d1/schema.sql --remote
npm exec wrangler -- d1 execute plates-db-production --file ./src/d1/schema.sql --remote
```

# Paso 5 — Secretos por entorno (nunca en wrangler.toml, nunca en el repo):

```
npm exec wrangler -- secret put GOOGLE_CLIENT_ID --env staging
npm exec wrangler -- secret put GOOGLE_CLIENT_SECRET --env staging
npm exec wrangler -- secret put SESSION_SIGNING_SECRET --env staging   # cualquier cadena aleatoria larga, ej. openssl rand -base64 32
```

Repetir los tres con `--env production` (y, si se quiere, con secretos distintos a los de staging).

# Paso 6 — Desplegar:

```
npm run deploy:staging      # ya definido en package.json — usa el wrangler local
npm run deploy:production
```

Cada despliegue imprime la URL real del Worker (`*.workers.dev` o dominio custom si se configura). Si difiere de lo puesto en el paso de `vars`, actualizar `OAUTH_REDIRECT_BASE_URL` en `wrangler.toml` y volver a desplegar.

# Paso 7 — Apuntar el frontend al Worker real:

```
# .env.cf-staging — añadir/confirmar:
VITE_WORKER_BASE_URL=https://staging.plates-worker.workers.dev
```

```
# .env.production — falta hoy, añadir:
VITE_WORKER_BASE_URL=https://plates-worker.workers.dev
```

# Opcional — desarrollo 100% local del Worker (sin desplegar), útil para iterar rápido:

```
cd worker
npm exec wrangler -- dev --env staging   # starts the worker at http://localhost:8787, with D1/DO simulated locally
npm exec wrangler -- d1 execute plates-db-staging --env staging --local --file=./src/d1/schema.sql   # without --remote → applies to the D1 locally persisted
```

Para que este modo local también valide contra Google real, crear un `worker/.dev.vars` (añadir a `.gitignore`, nunca commitear) con:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SIGNING_SECRET=...
```

`wrangler dev` carga `.dev.vars` automáticamente — no requiere `npm exec wrangler -- secret put` para uso local.

> en [explorer](http://localhost:8787/cdn-cgi/explorer) hay una UI para inspeccionar la BD

> para resetear los datos borrar `.wrangler\state\v3\do`