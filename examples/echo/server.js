const TcpServer = require('../../server');

class EchoHandler {
    static onStarted(server) {
    }

    static onStopped(server) {
    }

    static onConnected(socket) {
    }

    static onClosed(socket) {
    }

    static onError(socket, err) {
        console.log(err.stack);
    }

    static async process(socket, incomingMessage) {
        return incomingMessage;
    }
}

module.exports = class extends TcpServer {
    constructor() {
        super(EchoHandler, {port:8212});
    }
}