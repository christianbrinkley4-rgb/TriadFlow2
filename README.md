# Personal Financial Command Center (Vite + GitHub Pages)

## Local architecture setup

```bash
# 1) If starting from an existing static repo, initialize npm and install Vite
npm init -y
npm install -D vite

# 2) Keep index.html at project root (Vite convention)
#    Place styles and JS under src for cleaner structure
mkdir -p src
mv styles.css src/styles.css
mv script.js src/main.js

# 3) Update index.html to point to /src/main.js and import CSS from JS
#    Then run local dev server
npm run dev

# 4) Build optimized production bundle
npm run build

# 5) Preview production build locally
npm run preview
```

## package.json scripts

- `npm run dev`: starts Vite dev server.
- `npm run build`: creates optimized production files in `dist/`.
- `npm run preview`: serves built `dist/` for verification.

## Security & performance audit notes

- Vite uses ES module graph analysis and Rollup for production bundling.
- Unused code paths are removed during tree-shaking when modules are structured with ESM imports/exports.
- JavaScript and CSS are minified in production builds (`esbuild` + CSS minification), reducing payload size and parse time.
- Hashed assets in `dist/` improve cache correctness and stale-asset safety.
- Source maps are disabled in production (`sourcemap: false`) to reduce artifact surface area.

## GitHub Actions deployment

Workflow file: `.github/workflows/deploy.yml`.

Behavior:
- Triggers on pushes to `main`.
- Uses Ubuntu runner.
- Installs dependencies with `npm ci`.
- Builds with `npm run build`.
- Uploads `dist/` and deploys using `actions/deploy-pages@v4`.
