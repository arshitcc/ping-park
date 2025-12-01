import api from "./axios";
import {
  AddParticipantsForm,
  AssignParticipantRoleForm,
  CreateGroupForm,
  DirectChatForm,
  RemoveParticipantsForm,
  UpdateGroupProfileForm,
} from "../lib/schemas/chat";

class ChatService {
  static async getUserChats() {
    return api.get("/chats");
  }

  static async searchUsers(searchTerm: string) {
    return api.get(`/chats/c?s=${searchTerm}`);
  }

  static async createGroup(data: CreateGroupForm) {
    return api.post("/chats/c", data);
  }

  static async startDirectChat(data: DirectChatForm) {
    return api.put("/chats/c", data);
  }

  static async addNewParticipantsToGroup(
    chatID: string,
    data: AddParticipantsForm
  ) {
    return api.put(`/chats/c/${chatID}`, data);
  }

  static async removeParticipantsFromGroup(
    chatID: string,
    data: RemoveParticipantsForm
  ) {
    return api.patch(`/chats/c/${chatID}`, data);
  }

  static async deleteGroup(chatID: string) {
    return api.delete(`/chats/c/${chatID}`);
  }

  static async assignParticipantRole(
    chatID: string,
    data: AssignParticipantRoleForm
  ) {
    return api.patch(`/chats/c/${chatID}/settings`, data);
  }

  static async updateGroupProfile(
    chatID: string,
    data: UpdateGroupProfileForm
  ) {
    return api.put(`/chats/c/${chatID}/settings`, data);
  }

  static async leaveGroup(chatID: string) {
    return api.delete(`/chats/c/${chatID}/leave`);
  }
}

export default ChatService;
