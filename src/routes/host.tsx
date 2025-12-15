import { Head } from "fresh/runtime";
import { APP_NAME } from "~/consts.ts";
import { HostIsland } from "~/islands/HostIsland.tsx";
import { define } from "~/utils/typing.ts";

export default define.page((
  { url },
) => {
  return (
    <main>
      <Head>
        <title>ホスト画面 | {APP_NAME}</title>
      </Head>
      <section>
        <HostIsland url={url} />
      </section>
    </main>
  );
});
