import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import jwt from "jsonwebtoken";
import http from "http";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment variables");
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let rooms = new Map<string, WebSocket[]>();

type Payload = {
  roomid: string;
  message: string;
};
type Message = {
  type: "join" | "leave" | "message";
  payload: Payload;
};

wss.on("connection", (socket, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  if (!token) {
    socket.close(1008, "Missing token");
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    (socket as any).userId = payload.userId;
  } catch (err) {
    socket.close(1008, "Invalid token");
    return;
  }

  socket.on("message", (message: Buffer) => {
    const parsedMessage = JSON.parse(message.toString()) as Message;

    if (parsedMessage.type === "join") {
      rooms.set(parsedMessage.payload.roomid, [
        ...(rooms.get(parsedMessage.payload.roomid) || []),
        socket,
      ]);
    } else if (parsedMessage.type === "leave") {
      rooms.set(
        parsedMessage.payload.roomid,
        rooms.get(parsedMessage.payload.roomid)?.filter((s) => s !== socket) || []
      );
    } else if (parsedMessage.type === "message") {
      rooms.get(parsedMessage.payload.roomid)?.forEach((s) =>
        s.send(parsedMessage.payload.message)
      );
    }
  });

  socket.on("close", () => {
    rooms.forEach((sockets, roomid) => {
      rooms.set(roomid, sockets.filter((s) => s !== socket));
    });
  });
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
