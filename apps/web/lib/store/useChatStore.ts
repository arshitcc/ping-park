import { create } from "zustand";
import { persist } from "zustand/middleware";

type ChatStore = {
  // chats: {}[];
  chat: {} & { messages: [] };
  loadingChats: boolean;

  // setChats: (chats: {}[]) => void;
  setChat: (chat: {}) => void;
  setLoadingChats: (loadingChats: boolean) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // chats: [],
      chat: { messages: [] },
      loadingChats: false,

      // setChats: (chats) => set({ chats }),

      setChat: (chat) =>
        set((p) => ({
          chat: {
            ...chat,
            messages: p.chat.messages,
          },
        })),

      setLoadingChats: (loadingChats) => set({ loadingChats }),
    }),
    { name: "chats" }
  )
);
