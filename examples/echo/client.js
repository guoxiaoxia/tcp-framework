const TcpClient = require('../../client');
const Message = require('../../message');

module.exports = class extends TcpClient {
    constructor() {
        super({port: 8212});
        this._pendings = new Map();
    }

    onMessage(incomingMessage) {
        let callback = this._pendings.get(incomingMessage.uuid);
        if (callback !== undefined) {
            this._pendings.delete(incomingMessage.uuid);
            callback.success(incomingMessage.payload.toString('utf8'));
        }
    }

    async request(request) {
        return new Promise((resolve, reject) => {
            let outgoingMessage = new Message(Message.SIGN_DATA, Buffer.from(request));
            this._pendings.set(outgoingMessage.uuid, {
                success: response => resolve(response),
                failure: error => reject(error)
            });
            this.send(outgoingMessage);
            setTimeout(() => {
                let callback = this._pendings.get(outgoingMessage.uuid);
                if (callback !== undefined) {
                    this._pendings.delete(outgoingMessage.uuid);
                    callback.failure(new Error('request timeout'));
                }
            }, 1000 * this._options.timeout);
        });
    }
};