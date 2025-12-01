import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chat, User } from "../../types";
import ChatService from "../../api/chats.api";

type ChatsStore = {
  chats: Chat[];
  loadingChats: boolean;

  searchUsers: (
    user: string
  ) => Promise<{ success: boolean; users?: Partial<User>[]; message?: string }>;
  getChats: () => Promise<void>;
  setChats: (chats: Chat[]) => void;
  setLoadingChats: (loadingChats: boolean) => void;
};

export const useChatsStore = create<ChatsStore>()(
  persist(
    (set, get) => ({
      chats: [],
      loadingChats: false,

      getChats: async () => {
        return;
      },

      searchUsers: async (user) => {
        try {
          const res = await ChatService.searchUsers(user);
          return { success: true, users: res.data.data };
        } catch (error) {
          return {
            success: false,
            message: "Failed to search users",
          };
        }
      },

      setChats: (chats) => set({ chats }),
      setLoadingChats: (loadingChats) => set({ loadingChats }),
    }),
    { name: "chats" }
  )
);
