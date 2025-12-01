import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import SocketService from "./socket";
import cookieParser from "cookie-parser";

const app = express();

dotenv.config();

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN!],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const server = http.createServer(app);

const socket = new SocketService();

socket.io.attach(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set("io", SocketService);

app.get("/", (req, res) => {
  res.json({ message: "ITs WORKING" });
});

import apiRouter from "./routes/route";
import connectDB from "./db/db";
import { errorHandler } from "./middlewares/error.middleware";

app.use("/api/v1", apiRouter);

socket.initialize(socket.io);

const PORT = process.env.PORT ?? 8080;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.info("⚙️  Server is up and running on PORT: ", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error: ", error);
  });

app.use(errorHandler);
