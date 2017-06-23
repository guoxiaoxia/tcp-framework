const Message = require('../message');
const assert = require('assert');

module.exports = class Server {
	constructor(handler, config = undefined) {
		assert(typeof handler.onStart === 'function', 'onStart function is missing in handler');
		assert(typeof handler.onStop === 'function', 'onStop function is missing in handler');
		assert(typeof handler.onConnected === 'function', 'onConnected function is missing in handler');
		assert(typeof handler.onReceived === 'function', 'onReceived function is missing in handler');
		assert(typeof handler.onClosed === 'function', 'onClosed function is missing in handler');

		this._config = require('./config').parse(config);
		this._handler = handler;
		this._socketMap = new Map();
		this._server = null;
		this._now = new Date().getTime();
	}

	get config() { return this._config; }

	start() {
		this._server = require('net').createServer(socket => this.onConnected(socket));
		this._server.listen(this._config.port, this._config.host);

		this._checkupTimer = setInterval(() => {
			this._now = new Date().getTime();
			for (let [socket, lastActiveTime] of this._socketMap) {
				if ((lastActiveTime + this._config.timeout * 1000) < this._now) {
					socket.end();
				}
			}
		}, 1000);

		if (this._config.duration !== null) {
			setTimeout(() => {
				this.stop();
			}, this._config.duration * 1000);
		}

		this._handler.onStart(this);
	}

	stop() {
		if (this._server === null) {
			return;
		}
		this._server.close();
		this._server = null;
		if (this._checkupTimer) {
			clearInterval(this._checkupTimer);
			this._checkupTimer = undefined;
		}
		this._handler.onStop(this);
		process.exit(0);
	}

	onConnected(socket) {
		socket.buffer = Buffer.alloc(0);
		socket.on('data', (incomingBuffer) => {
			this.onReceived(socket, incomingBuffer);
		});
		socket.on('error', err => {});
		socket.on('close', (hasError) => {
			this.onClosed(socket, {hasError})
		});
		this._socketMap.set(socket, this._now);
		this._handler.onConnected(socket);
	}

	onReceived(socket, incomingBuffer) {
		this._socketMap[socket] = this._now;
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
							let outgoingMessage = new Message(Message.SIGN_DATA, encodedOutgoingPayload, incomingMessage.uuid);
							socket.write(outgoingMessage.toBuffer());
						});
						break;
					default:
						break;
				}	
			}
		}
		catch(err) {
			socket.end();
		}
	}

	onClosed(socket, {hasError}) {
		delete this._socketMap[socket];
		this._handler.onClosed(socket);
	}
}
