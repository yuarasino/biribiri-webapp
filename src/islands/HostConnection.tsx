import { useEffect, useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { Guest, WebSocketMessage } from "~/types.ts";
import { HOST_UUID, LEVEL_DELAY, POWER_DELAY } from "~/consts.ts";

import type { GenericEventHandler } from "preact";

export type HostConnectionProps = {
  url: URL;
};

export const HostConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(10);
  const [duration, setDuration] = useState<number>(10);

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    setGuests([]);

    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    // ホストが接続したとき
    socket.addEventListener("open", () => {
      const message: WebSocketMessage = {
        type: "connect",
        data: {
          uuid: HOST_UUID,
          name: "host",
        },
      };
      socket.send(JSON.stringify(message));
    });

    // ゲストからメッセージがきたとき
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "connect") {
        if (!guests.find((guest) => guest.uuid === message.data.uuid)) {
          setGuests((prev) =>
            prev.concat({
              uuid: message.data.uuid,
              name: message.data.name,
              timer: -1,
              isRunning: false,
            })
          );
        }
      }
      if (message.type === "disconnect") {
        setGuests((prev) =>
          prev.filter((guest) => guest.uuid !== message.data.uuid)
        );
      }
    });

    globalThis.addEventListener("beforeunload", () => {
      if (!socket) {
        return;
      }
      const message: WebSocketMessage = {
        type: "disconnect",
        data: {
          uuid: HOST_UUID,
        },
      };
      socket.send(JSON.stringify(message));
      socket.close();
    });

    setSocket(socket);
  }, []);

  const onGuestChecked: GenericEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    if (target.checked) {
      setTargets((prev) => prev.concat(target.value));
    } else {
      setTargets((prev) => prev.filter((uuid) => uuid !== target.value));
    }
  };

  const onLevelInput: GenericEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    setLevel(Number(target.value));
  };

  const onDurationInput: GenericEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    setDuration(Number(target.value));
  };

  const loop = async () => {
    const sleep = (t: number) =>
      new Promise((resolve) => setTimeout(resolve, t));
    setGuests((prev) =>
      prev.map((guest) => {
        if (targets.includes(guest.uuid)) {
          return {
            ...guest,
            timer: duration,
          };
        } else {
          return guest;
        }
      })
    );
    await sleep(POWER_DELAY + LEVEL_DELAY * duration);
    for (let i = 0; i < duration; i++) {
      setGuests((prev) =>
        prev.map((guest) => {
          if (targets.includes(guest.uuid)) {
            return {
              ...guest,
              timer: guest.timer - 1,
              isRunning: true,
            };
          } else {
            return guest;
          }
        })
      );
      await sleep(1000);
    }
    setGuests((prev) =>
      prev.map((guest) => {
        if (targets.includes(guest.uuid)) {
          return {
            ...guest,
            timer: -1,
            isRunning: false,
          };
        } else {
          return guest;
        }
      })
    );
  };

  const onLaunchClicked: GenericEventHandler<HTMLButtonElement> = async () => {
    if (!socket) {
      return;
    }
    const message: WebSocketMessage = {
      type: "launch",
      data: {
        targets: targets,
        level: level,
        duration: duration,
      },
    };
    socket.send(JSON.stringify(message));

    setTargets([]);

    await loop();
  };

  return (
    <div class={cn("p-8 max-w-5xl mx-auto")}>
      <div class={cn("mb-12")}>
        <h2 class={cn("text-2xl font-bold mb-6 text-gray-800")}>
          接続中のゲスト
        </h2>
        <div class={cn("flex flex-wrap gap-6")}>
          {guests.map((guest) => (
            <div
              key={guest.uuid}
              class={cn(
                "w-[200px] h-[200px] rounded-xl border-2 flex flex-col items-center justify-between p-5 transition-all duration-200 shadow-sm",
                guest.timer >= 0
                  ? "border-red-500 bg-red-50 shadow-red-100"
                  : (targets.includes(guest.uuid)
                    ? "border-blue-500 bg-blue-50 shadow-blue-100"
                    : "border-gray-200 bg-white hover:border-gray-300"),
                guest.isRunning ? "animate-shake" : "",
              )}
            >
              <div class={cn("text-center w-full")}>
                <div
                  class={cn(
                    "font-bold text-gray-800 text-lg mb-1 truncate px-1",
                  )}
                  title={guest.name}
                >
                  {guest.name}
                </div>
                <div class={cn("text-xs text-gray-400 font-mono hidden")}>
                  {guest.uuid.slice(0, 8)}...
                </div>
              </div>

              <div
                class={cn("text-4xl font-mono font-bold text-gray-700 my-2")}
              >
                {guest.timer >= 0
                  ? (
                    <>
                      {guest.timer}
                      <span
                        class={cn("text-sm ml-1 text-gray-400 font-normal")}
                      >
                        s
                      </span>
                    </>
                  )
                  : <span class={cn("text-2xl")}>休電中</span>}
              </div>

              <label class={cn("cursor-pointer w-full")}>
                <input
                  type="checkbox"
                  value={guest.uuid}
                  checked={targets.includes(guest.uuid)}
                  onChange={onGuestChecked}
                  class={cn("peer sr-only")}
                />
                <div
                  class={cn(
                    "w-full py-2 bg-gray-100 peer-checked:bg-blue-600 text-gray-600 peer-checked:text-white text-sm font-bold text-center rounded-lg transition-colors",
                  )}
                >
                  {targets.includes(guest.uuid) ? "選択中" : "選択する"}
                </div>
              </label>
            </div>
          ))}
          {guests.length === 0 && (
            <div
              class={cn(
                "w-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl",
              )}
            >
              ゲストはまだ接続していません
            </div>
          )}
        </div>
      </div>

      <div class={cn("bg-gray-50 border border-gray-200 rounded-xl p-6")}>
        <h3 class={cn("text-lg font-bold text-gray-700 mb-4")}>コントロール</h3>
        <div class={cn("flex flex-wrap items-end gap-6")}>
          <div class={cn("flex flex-col gap-2")}>
            <label class={cn("text-sm font-semibold text-gray-600")}>
              強度 (10～15)
            </label>
            <input
              type="number"
              value={level}
              onInput={onLevelInput}
              class={cn(
                "w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 font-mono",
              )}
              min={10}
              max={15}
            />
          </div>
          <div class={cn("flex flex-col gap-2")}>
            <label class={cn("text-sm font-semibold text-gray-600")}>
              時間 (10～20)
            </label>
            <div class={cn("relative")}>
              <input
                type="number"
                value={duration}
                onInput={onDurationInput}
                class={cn(
                  "w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 font-mono",
                )}
                min={10}
                max={20}
              />
              <span
                class={cn("absolute right-3 top-2.5 text-gray-400 text-sm")}
              >
                s
              </span>
            </div>
          </div>
          <div class={cn("flex-1")} />
          <div>
            <button
              type="button"
              onClick={onLaunchClicked}
              class={cn(
                "bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-red-200 active:transform active:scale-95 transition-all text-lg",
              )}
              disabled={!socket}
            >
              起動
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
