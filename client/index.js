const net = require('net');
const Message = require('../message');
const Doctor = require('./doctor');
const assert = require('assert');

const STATUS_DISCONNECTED = 0;
const STATUS_CONNECTING = 1;
const STATUS_CONNECTED = 2;

/*============Functions that mean to be overwritten===========*/
/*
    onConnected(socket) {
    }

    onClosed(socket) {
    }

    onError(socket, err) {
    }
    
    async send(outgoingPayload) {
    }
}
*/

module.exports = class Client {
	constructor(options) {
		assert(Number.isInteger(options.port), 'options.port is not correctly configured');
		if (options.host === undefined) {
			options.host = 'localhost';
		}
		if (!Number.isInteger(options.timeout)) {
			options.timeout = 3;
		}
		this._options = options;

		this._tasks = new Map();
		this._doctor = new Doctor(this);
		this._status = STATUS_DISCONNECTED;
		this._buffer = Buffer.alloc(0);
		this._connect();
	}

	async send(outgoingPayload) {
		let outgoingMessage = new Message(Message.SIGN_DATA, outgoingPayload);
		return new Promise((resolve, reject) => {
			this._tasks.set(outgoingMessage.uuid, {
				message: outgoingMessage,
				successCallback: incomingPayload => resolve(incomingPayload),
				failureCallback: error => reject(error)
			});
			if (this._status === STATUS_CONNECTED) {
				this._socket.write(outgoingMessage.toBuffer());
			}
			setTimeout(() => {
				this._tasks.delete(outgoingMessage.uuid);
				reject(new Error('request timeout'));
			}, this._options.timeout * 1000);
		});
	}

	_connect() {
		this._status = STATUS_CONNECTING;
		this._socket = net.createConnection(this._options.port, this._options.host, () => {
			if (typeof this.onConnected === 'function') {
				this.onConnected();
			}
			this._status = STATUS_CONNECTED;
			this._doctor.start(this._socket);
			for (let [uuid, task] of this._tasks) {
				this._socket.write(task.message.toBuffer());
			}
		});
		this._socket.on('data', (incomingBuffer) => {
			this._buffer = Buffer.concat([this._buffer, incomingBuffer]);
			this._doctor.yelp();
			this._process();
		});
		this._socket.on('error', (err) => {
			if (typeof this.onError === 'function') {
				this.onError(err);
			}
		});
		this._socket.on('close', (hasError) => {
			this._close(hasError);
		});
	}

	_close(hasError) {
		if (hasError) {
			this._socket.destroy();
		}
		else {
			this._socket.end();
		}
		this._status = STATUS_DISCONNECTED;
		if (typeof this.onClosed === 'function') {
			this.onClosed();
		}

		setTimeout(() => {
			if (this._status !== STATUS_DISCONNECTED) {
				return;
			}
			this._connect();
		}, 200);
	}

	_process() {
		while(true) {
			let {consumed, message:incomingMessage} = Message.parse(this._buffer);
			if (consumed === 0) {
				break;
			}

			this._buffer = this._buffer.slice(consumed);
			if (incomingMessage.sign === Message.SIGN_DATA) {
				let task = this._tasks.get(incomingMessage.uuid);
				if (task !== undefined) {
					task.successCallback(incomingMessage.payload);
					this._tasks.delete(incomingMessage.uuid);
				}
			}
		}
	}
}
