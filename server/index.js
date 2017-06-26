const Message = require('../message');
const assert = require('assert');

/*============Functions that mean to be overwritten===========*/
/*
    onStarted() {
    }

    onStopped() {
    }

    onConnected(socket) {
    }

    onClosed(socket) {
    }

    onError(socket, err) {
    }
    
    async process(socket, incomingMessage) {
    }
}
*/

module.exports = class Server {
	constructor(options) {		
		assert(Number.isInteger(options.port), 'options.port is not correctly configured');
		if (options.host === undefined) {
			options.host = '0.0.0.0';
		}
		if (!Number.isInteger(options.timeout)) {
			options.timeout = 3;
		}
		this._options = options;
		this._socketMap = new Map();
		this._server = undefined;
		this._now = new Date().getTime();
	}

	start() {
		this._server = require('net').createServer(socket => this.accept(socket));
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

		if (typeof this.onStarted === 'function') {
			this.onStarted();
		}
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
		if (typeof this.onStopped === 'function') {
			this.onStopped();
		}
		process.exit(0);
	}

	accept(socket) {
		socket.buffer = Buffer.alloc(0);
		socket.on('data', (incomingBuffer) => {
			this._read(socket, incomingBuffer);
		});
		socket.on('error', error => {
			if (typeof this.onError === 'function') {
				this.onError(socket, error);
			}
		});
		socket.on('close', _ => {
			this._socketMap.delete(socket);
			if (typeof this.onClosed === 'function') {
				this.onClosed(socket);
			}
		});
		this._socketMap.set(socket, this._now);
		if (typeof this.onConnected === 'function') {
			this.onConnected(socket);
		}
	}

	async _read(socket, incomingBuffer) {
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
						socket.write(new Message(Message.SIGN_PING).toBuffer());
						break;
					case Message.SIGN_DATA:
						if (typeof this.process === 'function') {
							socket.write(new Message(Message.SIGN_DATA, await this.process(socket, incomingMessage.payload), incomingMessage.uuid).toBuffer());
						}
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