import { Head } from "fresh/runtime";
import { Icon } from "~/components/Icon.tsx";
import { define } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { APP_NAME } from "~/consts.ts";

export default define.page(() => {
  return (
    <main
      class={cn(
        "min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4",
      )}
    >
      <Head>
        <title>{APP_NAME}</title>
      </Head>
      <section class={cn("w-full max-w-4xl text-center")}>
        <div class={cn("mb-16")}>
          <h1
            class={cn(
              "text-5xl font-black text-gray-800 mb-4 tracking-tight drop-shadow-sm",
            )}
          >
            {APP_NAME}
          </h1>
          <p class={cn("text-xl text-gray-500 font-medium")}>
            参加スタイルを選択してください
          </p>
        </div>

        <div class={cn("grid md:grid-cols-2 gap-8 max-w-2xl mx-auto")}>
          {/* Host Card */}
          <div
            class={cn(
              "group relative bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-pink-500 hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 text-center flex flex-col items-center",
            )}
          >
            <div
              class={cn(
                "p-4 rounded-xl bg-pink-50 text-pink-500 mb-6 group-hover:scale-110 transition-transform duration-300",
              )}
            >
              <Icon
                icon="icon-[material-symbols-light--touch-app]"
                class={cn("text-4xl")}
                label="Host Icon"
              />
            </div>
            <h2 class={cn("text-2xl font-bold text-gray-800 mb-3")}>
              ホスト
            </h2>
            <p class={cn("text-gray-500 mb-8 leading-relaxed grow")}>
              ビリビリを流す側として参加します
            </p>
            <a
              href="/host"
              class={cn(
                "w-full py-4 text-center rounded-xl bg-gray-100 text-gray-700 font-bold group-hover:bg-pink-500 group-hover:text-white transition-all duration-300",
              )}
            >
              ホストとして開始
            </a>
          </div>

          {/* Guest Card */}
          <div
            class={cn(
              "group relative bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-100 transition-all duration-300 text-center flex flex-col items-center",
            )}
          >
            <div
              class={cn(
                "p-4 rounded-xl bg-cyan-50 text-cyan-500 mb-6 group-hover:scale-110 transition-transform duration-300",
              )}
            >
              <Icon
                icon="icon-[material-symbols-light--bolt]"
                class={cn("text-4xl")}
                label="Guest Icon"
              />
            </div>
            <h2 class={cn("text-2xl font-bold text-gray-800 mb-3")}>
              ゲスト
            </h2>
            <p class={cn("text-gray-500 mb-8 leading-relaxed grow")}>
              ビリビリを受ける側として参加します
            </p>
            <a
              href="/guest"
              class={cn(
                "w-full py-4 text-center rounded-xl bg-gray-100 text-gray-700 font-bold group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300",
              )}
            >
              ゲストとして参加
            </a>
          </div>
        </div>
      </section>
    </main>
  );
});
