import { App, staticFiles, trailingSlashes } from "fresh";
import { accessLogs } from "./middlewares/accessLogs.ts";

export const app = new App()
  .use(staticFiles())
  .use(trailingSlashes("never"))
  .use(accessLogs())
  .fsRoutes();
