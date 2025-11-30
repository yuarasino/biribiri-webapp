import { defineConfig, searchForWorkspaceRoot } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "./src",
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
