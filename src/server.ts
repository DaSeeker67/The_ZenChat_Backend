import { WebSocketServer , WebSocket} from "ws";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import jwt from "jsonwebtoken";
app.use(cors());
const JWT_SECRET : string | undefined = process.env.JWT_SECRET;
if(!JWT_SECRET){
  throw new Error("JWT_SECRET must be defined in environment variables");
}
const wss = new WebSocketServer({port: 9090});
dotenv.config();
let usercount=0;
const app= express();
app.use(express.json());


app.use("/api/auth",authRoutes);  

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})


// map of sockets with roomid as key and all sockets in that room as value
let rooms = new Map<string, WebSocket[]>();
type Payload={
    roomid:string;
    message:string;
}
type Message = {
  type: 'join' | 'leave' | 'message';
  payload: Payload;
}

wss.on('connection',(socket, req )=>{
  const url= new URL(req.url||"", `http://${req.headers.host}`)
  const token= url.searchParams.get("token");
  if(!token){
    socket.close(1008, "Missing token");
    return;
  }
  try{
    const payload= jwt.verify(token, JWT_SECRET) as {userId: number};
    (socket as any).userId= payload.userId;
  }catch(err){
    socket.close(1008, "Invalid token");
    return;
  }

  socket.on('message',(message: Buffer)=>{
    const parsedMessage = JSON.parse(message.toString()) as Message;
    if(parsedMessage.type==='join'){
      rooms.set(parsedMessage.payload.roomid, [...rooms.get(parsedMessage.payload.roomid) || [], socket]);
    }
    else if(parsedMessage.type==='leave'){
      rooms.set(parsedMessage.payload.roomid, rooms.get(parsedMessage.payload.roomid)?.filter((s)=>s!==socket) || []);
    }
    else if(parsedMessage.type==='message'){
      rooms.get(parsedMessage.payload.roomid)?.forEach((s)=>s.send(parsedMessage.payload.message));
    }
  });

  socket.on('close',()=>{
    rooms.forEach((sockets,roomid)=>{
      rooms.set(roomid, sockets.filter((s)=>s!==socket));
    });
  });
})
