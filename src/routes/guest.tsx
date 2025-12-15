import { Head } from "fresh/runtime";
import { APP_NAME } from "~/consts.ts";
import { GuestIsland } from "~/islands/GuestIsland.tsx";
import { define } from "~/utils/typing.ts";

export default define.page((
  { url },
) => {
  return (
    <main>
      <Head>
        <title>ゲスト画面 | {APP_NAME}</title>
      </Head>
      <section>
        <GuestIsland url={url} />
      </section>
    </main>
  );
});
