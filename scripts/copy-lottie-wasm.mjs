// Copies the dotLottie renderer into /public so the site serves it itself instead of the
// player's CDN fallback. Runs after every install, so the file always matches the package.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

let source;
try {
  // The package's exports map hides package.json, so resolve its entry file (in dist/) instead.
  source = path.join(path.dirname(require.resolve("@lottiefiles/dotlottie-web")), "dotlottie-player.wasm");
} catch {
  // The package is not installed (e.g. a production install without it): nothing to copy.
  process.exit(0);
}

if (!existsSync(source)) {
  console.warn(`[copy-lottie-wasm] ${source} not found`);
  process.exit(0);
}

const targetDir = path.join(process.cwd(), "public", "lottie");
mkdirSync(targetDir, { recursive: true });
copyFileSync(source, path.join(targetDir, "dotlottie-player.wasm"));
console.log("[copy-lottie-wasm] public/lottie/dotlottie-player.wasm updated");
