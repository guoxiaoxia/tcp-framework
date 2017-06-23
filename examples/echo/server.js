const TcpServer = require('../../server');

class EchoHandler {
    static onStarted(server) {
        console.log("server started");
    }

    static onStopped(server) {
        console.log("server stopped");
    }

    static onConnected(socket) {
        console.log("socket connected");
    }

    static onReceived(socket, incomingMessage, outgoingCallback/* = (outgoingMessage)*/) {
        console.log("socket received");
        outgoingCallback(incomingMessage);
    }

    static onClosed(socket) {
        console.log("socket closed");
    }
}

let server = new TcpServer(EchoHandler, {port: 8211});
server.start();