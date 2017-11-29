const net = require('net');
const Message = require('../message');
const assert = require('assert');

/*============Functions that mean to be overwritten===========*/
/*
    onError(err) {}
*/

module.exports = class {
	constructor(options) {
		assert(Number.isInteger(options.port), 'options.port is not correctly configured');
        options.host = options.hasOwnProperty('host') ? options.host : options.host = 'localhost';
        options.timeout = Number.isInteger(options.timeout) ? options.timeout : 3;

		this._options = options;
	}

	request(request) {
	    let outgoingMessage = new Message(Message.SIGN_DATA, Buffer.from(request));
        return new Promise((resolve, reject) => {
            let isDataComplete = false;
            this._socket = net.createConnection(this._options.port, this._options.host, () => {
                console.log('client connected event');

                this._socket.write(outgoingMessage.toBuffer());

                setTimeout(() => {
                    if (!isDataComplete) {
                        throw new Error('request timeout')
                    }
                }, this._options.timeout * 1000);
            });

            let _buffer = Buffer.alloc(0);
            this._socket.on('data', async (incomingBuffer) => {
                console.log('client data event');

                try {
                    _buffer = Buffer.concat([_buffer, incomingBuffer]);
                    let {consumed, message:incomingMessage} = Message.parse(_buffer);
                    if (consumed !== 0) {
                        this._socket.end();
                        isDataComplete = true;
                        _buffer = _buffer.slice(consumed);

                        if (incomingMessage.sign !== Message.SIGN_DATA) {
                            reject(`message sign wrong`);
                        }
                        resolve(incomingMessage.payload.toString('utf8'));
                    }
                }
                catch(error) {
                    this._socket.destroy(error);
                }
			});

            this._socket.on('error', (err) => {
                console.log('client error event');

                if (typeof this.onError === 'function') {
                    this.onError(err);
                }
                reject(err);
            });
        });
	}
};
