var express = require('express');
var http = require('http');
var websocket = require('ws');
var app = express();
var port = 9090;
var server = http.createServer(app);
var wss = new websocket.Server({ server: server });
app.use(express.json());
app.get('/ping', function (req, res) {
    res.send('pong');
});
wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        console.log(message);
    });
    ws.send('Hello! Message From Server!!');
});
server.listen(port, function () {
    console.log("\uD83D\uDE80 Server running on http://localhost:".concat(port));
});
