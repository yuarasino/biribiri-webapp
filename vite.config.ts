import * as path from "@std/path";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "./src",
  build: {
    outDir: path.join(Deno.cwd(), "_fresh"),
    emptyOutDir: true,
  },
  plugins: [
    fresh(),
    tailwindcss(),
  ],
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(Deno.cwd()),
      ],
    },
  },
});
