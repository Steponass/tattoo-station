import { intlayer } from "vite-intlayer";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { resolve } from "node:path";

// Cloudflare Workers' SSR environment resolves the "browser" export condition,
// which makes @intlayer/*-entry packages fall back to stubs that return no
// dictionaries. Force them back to the real generated files so useIntlayer()
// has data to read during SSR.
const intlayerMainDir = resolve(__dirname, ".intlayer/main");

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    intlayer()
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@intlayer/dictionaries-entry": resolve(intlayerMainDir, "dictionaries.mjs"),
      "@intlayer/unmerged-dictionaries-entry": resolve(intlayerMainDir, "unmerged_dictionaries.mjs"),
      "@intlayer/remote-dictionaries-entry": resolve(intlayerMainDir, "remote_dictionaries.mjs"),
      "@intlayer/dynamic-dictionaries-entry": resolve(intlayerMainDir, "dynamic_dictionaries.mjs"),
      "@intlayer/fetch-dictionaries-entry": resolve(intlayerMainDir, "fetch_dictionaries.mjs"),
    },
  },
});
