// Source entry for the vendored, sandbox-only Three.js runtime.
// Regenerate public/builder-runtime/sandu-three-0.169.0.min.js with:
// npx --yes esbuild@0.25.10 scripts/builder-three-runtime-entry.js --bundle --minify --format=iife --target=es2020 --outfile=public/builder-runtime/sandu-three-0.169.0.min.js --banner:js="/*! Three.js r169 (MIT) + SanduAI runtime entry; see THREE-LICENSE.txt */"
import * as ThreeCore from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

globalThis.THREE = Object.freeze({
  ...ThreeCore,
  OrbitControls,
  GLTFLoader,
});
