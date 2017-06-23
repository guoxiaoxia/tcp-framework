const TcpClient = require('../../client');

module.exports = class extends TcpClient {
    constructor() {
        super({port: 8212});
    }

    async send(request) {
        let incomingMessage = await super.send(Buffer.from(request));
        return incomingMessage.toString('utf8');
    }
};