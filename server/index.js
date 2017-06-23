const Message = require('../message');
const assert = require('assert');

/*============template of Handler===========*/
/*
class Handler {
    static onStarted(server) {
    }

    static onStopped(server) {
    }

    static onConnected(socket) {
    }

    static onReceived(socket, incomingMessage, outgoingCallback = (outgoingMessage)) {
    }

    static onClosed(socket) {
    }

    static onError(socket, error) {
        
    }
};
*/

module.exports = class Server {
	constructor(handler, options) {
		assert(typeof handler.onStarted === 'function', 'onStarted function is missing in handler');
		assert(typeof handler.onStopped === 'function', 'onStopped function is missing in handler');
		assert(typeof handler.onConnected === 'function', 'onConnected function is missing in handler');
		assert(typeof handler.onReceived === 'function', 'onReceived function is missing in handler');
		assert(typeof handler.onClosed === 'function', 'onClosed function is missing in handler');
		assert(typeof handler.onError === 'function', 'onError function is missing in handler');
		
		assert(Number.isInteger(options.port), 'options.port is not correctly configured');
		if (options.host === undefined) {
			options.host = '0.0.0.0';
		}
		if (!Number.isInteger(options.timeout)) {
			options.timeout = 3;
		}
		this._options = options;

		this._handler = handler;
		this._socketMap = new Map();
		this._server = undefined;
		this._now = new Date().getTime();
	}

	start() {
		this._server = require('net').createServer(socket => this.onConnected(socket));
		this._server.listen(this._options.port, this._options.host);

		this._checkupTimer = setInterval(() => {
			this._now = new Date().getTime();
			for (let [socket, lastActiveTime] of this._socketMap) {
				if ((lastActiveTime + this._options.timeout * 1000) < this._now) {
					socket.destroy(new Error(`timeout(idle for over ${this._options.timeout} seconds`));
				}
			}
		}, 1000);

		if (Number.isInteger(this._options.duration)) {
			setTimeout(() => {
				this.stop();
			}, this._options.duration * 1000);
		}

		this._handler.onStarted(this);
	}

	stop() {
		if (this._server === undefined) {
			return;
		}
		this._server.close();
		this._server = undefined;
		if (this._checkupTimer) {
			clearInterval(this._checkupTimer);
			this._checkupTimer = undefined;
		}
		this._handler.onStopped(this);
		process.exit(0);
	}

	onConnected(socket) {
		socket.buffer = Buffer.alloc(0);
		socket.on('data', (incomingBuffer) => {
			this.onReceived(socket, incomingBuffer);
		});
		socket.on('error', error => {
			this._handler.onError(socket, error);
		});
		socket.on('close', _ => {
			this._socketMap.delete(socket);
			this._handler.onClosed(socket);
		});
		this._socketMap.set(socket, this._now);
		this._handler.onConnected(socket);
	}

	onReceived(socket, incomingBuffer) {
		this._socketMap.set(socket, this._now);
		socket.buffer = Buffer.concat([socket.buffer, incomingBuffer]);

		try {
			while(true) {
				let {consumed, message:incomingMessage} = Message.parse(socket.buffer);
				if (consumed === 0) {
					break;
				}
				socket.buffer = socket.buffer.slice(consumed);

				switch(incomingMessage.sign) {
					case Message.SIGN_PING:
						let outgoingMessage = new Message(Message.SIGN_PING);
						socket.write(outgoingMessage.toBuffer());
						break;
					case Message.SIGN_DATA:
						this._handler.onReceived(socket, incomingMessage.payload, (outgoingPayload) => {
							let outgoingMessage = new Message(Message.SIGN_DATA, outgoingPayload, incomingMessage.uuid);
							socket.write(outgoingMessage.toBuffer());
						});
						break;
					default:
						break;
				}	
			}
		}
		catch(error) {
			socket.destroy(error);
		}
	}
}