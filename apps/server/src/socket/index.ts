import { Server, Socket } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error";
import { notRequiredFields, User } from "../models/users.model";

class SocketService {
  private _io: Server;

  constructor() {
    console.log("Socket Server Initialized");
    this._io = new Server();
  } 

  get io() {
    return this._io;
  } 
 
  public initialize(io: Server) {
    return io.on("connection", async (socket) => {
      try {
        console.log(`${socket.id} connected`);
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        let token = cookies?.accessToken;

        if (!token) {
          // If no access token in cookies. Check in the handshake auth
          token = socket.handshake.auth?.token;
        }

        if (!token) {
          throw new ApiError(401, "Un-Authorized to app or Session Expired");
        }

        const decodedToken = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET!
        ) as { _id: String };

        const user = await User.findById(decodedToken?._id?.toString()).select(
          notRequiredFields
        );

        if (!user) {
          throw new ApiError(401, "Un-authorized handshake. Token is invalid");
        }

        socket.data.user = user;

        socket.join(socket.data.user._id.toString());

        socket.emit("connected");

        SocketService.mountJoinChat(socket);
        SocketService.mountTyping(socket);
        SocketService.unmountTyping(socket);

        socket.on("disconnected", () => {
          console.log(`${socket.id} disconnected`);
          if (socket.data.user?._id) {
            socket.leave(socket.data.user._id);
          }
        });
      } catch (error) {}
    });
  }

  static mountJoinChat(socket: Socket) {
    socket.on("join:chat", (chatId) => {
      socket.join(chatId);
    });
  }

  static mountTyping(socket: Socket) {
    socket.on("typing", (chatId) => {
      socket.broadcast
        .to(chatId)
        .emit("typing", { chatId, userId: socket.data.user._id });
    });
  }

  static unmountTyping(socket: Socket) {
    socket.on("stop:typing", (chatId) => {
      socket.broadcast
        .to(chatId)
        .emit("stop:typing", { chatId, userId: socket.data.user._id });
    });
  }
}

export default SocketService;
