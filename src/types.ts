export type WebSocketMessage = {
  type: "connect";
  data: {
    uuid: string;
    name: string;
  };
} | {
  type: "disconnect";
  data: {
    uuid: string;
  };
} | {
  type: "launch";
  data: {
    targets: string[];
    level: number;
    duration: number;
  };
};

export type Guest = {
  uuid: string;
  name: string;
  timer: number;
  isRunning: boolean;
};

// deno-lint-ignore no-explicit-any
export type NavigatorWithSerial = any;

// deno-lint-ignore no-explicit-any
export type SerialPort = any;
