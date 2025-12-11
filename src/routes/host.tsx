import { Head } from "fresh/runtime";
import { define } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { HostConnection } from "~/islands/HostConnection.tsx";

export default define.page((
  { url },
) => {
  return (
    <main>
      <Head>
        <title>biribiri-webapp</title>
      </Head>
      <section>
        <h1 class={cn("text-pink-500")}>biribiri-webapp</h1>
        <HostConnection url={url} />
      </section>
    </main>
  );
});
