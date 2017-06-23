const TcpClient = require('../../client');

module.exports = class extends TcpClient {
    constructor() {
        super({port: 8212});
    }

    send(request, responseCallback, errorCallback) {
        super.send(Buffer.from(request), (incomingMessage) => {
            responseCallback(incomingMessage.toString('utf8'));
        }, errorCallback);
    }
};