"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 9090 });
let usercount = 0;
// map of sockets with roomid as key and all sockets in that room as value
let rooms = new Map();
wss.on('connection', (socket) => {
    usercount++;
    socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
       if(parsedMessage.type === 'join'){
        const roomid= parsedMessage.payload.roomid;
        if(!rooms.has(roomid)){
            rooms.set(roomid, []);
            rooms.get(roomid).push(socket);

        }else{
            rooms.get(roomid).push(socket);
            socket.send("welcome to the room");
        }
       }
       else if(parsedMessage.type === 'message'){
        const roomid= parsedMessage.payload.roomid;
        if(rooms.has(roomid)){
            rooms.get(roomid).forEach((s)=>s.send(parsedMessage.payload.message));
        }
       }
       else if(parsedMessage.type === 'leave'){
        const roomid= parsedMessage.payload.roomid;
        if(rooms.has(roomid)){
            rooms.get(roomid).splice(rooms.get(roomid).indexOf(socket), 1);
        }
       }
    });
    socket.on('close', () => {
        rooms.forEach((sockets, roomid) => {
            rooms.set(roomid, sockets.filter((s) => s !== socket));
        });
    });
});
