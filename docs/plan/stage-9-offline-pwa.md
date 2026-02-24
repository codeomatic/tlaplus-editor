# Stage 9: PWA and Offline Support

## Description
This final milestone converts the application into a Progressive Web App (PWA). This allows TLC Model checking entirely offline by caching all necessary assets locally in the browser.

## What exactly needs to be built
1. Use a tool like `vite-plugin-pwa` to easily inject service worker capabilities into the Vite build.
2. Configure the service worker to explicitly cache all critical static assets: `index.html`, JS/CSS bundles, and Monaco editor worker scripts.
3. Critically, ensure that the `tla2tools.jar`, the `loader.js` (and any associated payload files fetched by CheerpJ), and the Tree-sitter `.wasm` files are heavily cached.
4. Provide a `manifest.json` file for app icons, name, and display parameters (standalone) so it can be installed as an app.
5. Add a UI notification to inform the user when the app is "Ready for offline use."

## How to check that it was built
1. Run `npm run build` and test the production build using a local static server.
2. Open the page and let the service worker install and cache assets.
3. Turn off your Wi-Fi, or simulate "Offline" in the Network tab of the browser's Developer Tools.
4. Refresh the page.
5. Verify the editor fully loads without any network access.
6. Click "Run" to launch a model check.
7. Verify that TLC successfully executes and produces output without making any network requests.
