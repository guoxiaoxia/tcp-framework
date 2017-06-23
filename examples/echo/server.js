const TcpServer = require('../../server');

class EchoHandler {
    static onStarted(server) {
    }

    static onStopped(server) {
    }

    static onConnected(socket) {
    }

    static onReceived(socket, incomingMessage, outgoingCallback/* = (outgoingMessage)*/) {
        outgoingCallback(incomingMessage);
    }

    static onClosed(socket) {
    }

    static onError(socket, err) {
        console.log("got error " + err.stack);
    }
}

module.exports = class extends TcpServer {
    constructor() {
        super(EchoHandler, {port:8212});
    }
}