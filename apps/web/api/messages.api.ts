import api from "./axios";
import { EditMessageForm, MessageForm } from "../lib/schemas/message";

class MessageService {
  static async getChatMessages(chatID: string) {
    return api.get(`/chats/c/${chatID}/m`);
  }

  static async sendMessage(chatID: string, data: MessageForm) {
    return api.post(`/chats/c/${chatID}/m`, data);
  }

  static async editMessage(
    chatID: string,
    messageID: string,
    data: EditMessageForm
  ) {
    return api.patch(`/chats/c/${chatID}/m/${messageID}`, data);
  }

  static async deleteMessage(chatID: string, messageID: string) {
    return api.delete(`/chats/c/${chatID}/m/${messageID}`);
  }
}

export default MessageService;
