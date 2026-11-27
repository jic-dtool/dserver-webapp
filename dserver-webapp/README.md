# dserver-webapp

## Project setup (for development)
```
npm install
```

### Configure endpoints

Create a file `.env` in the `dserver-webapp` directory with the following contents:
```
VUE_APP_DTOOL_LOOKUP_SERVER_URL="http://localhost:5000"
VUE_APP_DTOOL_LOOKUP_SERVER_TOKEN_GENERATOR_URL="http://localhost:5001/token"
```
For deployment, replace these URLs with the actual endpoints of the lookup server and the token generator.

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests, lint and type check
```
npm run test:unit
npm run lint
npm run type-check
```

The app is built with Vite. Configuration comes from `VUE_APP_*` environment
variables or `.env` files at build time (`import.meta.env.VUE_APP_*`).

### Lints and fixes files
```
npm run lint
```

## Project setup (for deployment)

Install packages and configure endpoints as described above.

### Compile
```
npm run build
```

### Run web server

Configure webserver (e.g. [nginx](https://nginx.org/)) to statically serve the `dist` subdirectory create by the _build_ command.

## Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
