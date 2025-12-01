import socketio, { type Socket } from "socket.io-client";
import { create } from "zustand";

export const e = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  LEAVE_CHAT: "LEAVE_CHAT",
  UPDATE_CHAT: "UPDATE_CHAT",
  JOIN_CHAT: "JOIN_CHAT",
  NEW_CHAT: "NEW_CHAT",
  TYPING: "TYPING",
  NOT_TYPING: "NOT_TYPING",
  MESSAGE_SEEN: "MESSAGE_SEEN",
  MESSAGE_DELIVERED: "MESSAGE_DELIVERED",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_EDITED: "MESSAGE_EDITED",
  MESSAGE_RECIEVED: "MESSAGE_RECEIVED",
  MESSAGE_DELETED: "MESSAGE_DELETED",
} as const;

type SocketStore = {
  socket: Socket | null;
  connected: boolean;
  initSocket: () => void;
  disconnectSocket: () => void;
  emit: (event: string, ...args: any[]) => void;
};

const connectSocket = () => {
  const token = localStorage.getItem("x-key");
  if (token?.trim()) {
    return socketio(process.env.NEXT_PUBLIC_SOCKET_URI, {
      withCredentials: true,
      auth: { token },
    });
  }
  return socketio(process.env.NEXT_PUBLIC_SOCKET_URI);
};

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,

  initSocket: () => {
    if (get().socket) return;
    const socket = connectSocket();

    socket.on(e.CONNECTED, () => set({ connected: true }));
    socket.on(e.DISCONNECTED, () => set({ connected: false }));
    // socket.on("connect_error", (err: any) => {
    //   console.warn("Socket connect_error:", err);
    // });
    set({ socket });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (!s) {
      return;
    }
    s.removeAllListeners();
    s.disconnect();
    set({ socket: null, connected: false });
  },


  emit: (event: string, ...args: any[]) => {
    const s = get().socket;
    if (!s) {
      console.warn("Emit Failed!! Socket not initialized yet");
      return;
    }
    s.emit(event, ...args);
  },
}));
