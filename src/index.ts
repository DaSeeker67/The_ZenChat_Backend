import { WebSocketServer , WebSocket} from "ws";
const wss = new WebSocketServer({port: 9090});

let usercount=0;

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

wss.on('connection',(socket )=>{
 
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