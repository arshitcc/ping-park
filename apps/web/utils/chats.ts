import { formatDistanceToNow } from "date-fns";
import { Chat, User } from "../types";

const getInitials = (name: string) => {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "PP"
  );
};

const getChatName = (chat: Chat, user: User | null) => {
  if (chat.type === "DIRECT") {
    const otherThanUser = chat.participants.find(
      (p) => p.member._id !== user?._id
    );
    return otherThanUser?.member.fullname || "Ping-Park";
  } else return chat.title;
};

const formatTime = (date: Date) => {
  return formatDistanceToNow(date, { addSuffix: false });
};

export { getInitials, getChatName, formatTime };