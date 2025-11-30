import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  root: "./src",
  plugins: [
    fresh(),
  ],
});
