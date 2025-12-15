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
  type: "name";
  data: {
    uuid: string;
    name: string;
  };
} | {
  type: "launch";
  data: {
    targets: string[];
    level: number;
    duration: number;
  };
};

export type SerialPort = {
  writable: WritableStream;
  open: (
    options?: { baudRate?: number },
  ) => Promise<void>;
  close: () => Promise<void>;
};

export type Serial = {
  requestPort: (
    options?: { filters?: { usbVendorId?: number }[] },
  ) => Promise<SerialPort>;
};

export type NavigatorWithSerial = Navigator & {
  serial: Serial;
};

export type Guest = {
  uuid: string;
  name: string;
  timer: number;
  isRunning: boolean;
};

export type GuestWithPort = Guest & {
  port: SerialPort;
};

export type GuestWithIsSelected = Guest & {
  isSelected: boolean;
};
