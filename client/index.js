const net = require('net');
const Message = require('../message');
const Task = require('./task');
const Doctor = require('./doctor');
const Ajv = require('ajv');
const ajv = new Ajv();
const assert = require('assert');

const STATUS_DISCONNECTED = 0;
const STATUS_CONNECTING = 1;
const STATUS_CONNECTED = 2;

module.exports = class Client {
	constructor(opt) {
		if (!ajv.validate({
			type: "object",
			properties: {
				host: {type: "string"},
				port: {type: "integer"},
				timeout: {type: "integer"}
			},
			additionalProperties: false,
			required: ["port"]
		}, opt)) {
			throw new Error('bad opt');
		}

		this._config = {
			host:opt.host ? opt.host : 'localhost', 
			port:opt.port,
			timeout:opt.timeout ? opt.timeout : 30
		};

		this._tasks = new Map();
		this._doctor = new Doctor(this);
		this._status = STATUS_DISCONNECTED;
		this._buffer = Buffer.alloc(0);
		this._connect();
	}

	send(outgoingPayload, successCallback/* = (incomingPayload) */, failureCallback/* = (err) */) {
		let outgoingMessage = new Message(Message.SIGN_DATA, outgoingPayload);
		let task = new Task(outgoingMessage, successCallback, failureCallback);
		this._tasks.set(outgoingMessage.uuid, task);
		if (this._status === STATUS_CONNECTED) {
			this._socket.write(outgoingMessage.toBuffer());
		}
		setTimeout(() => {
			let task = this._tasks.get(outgoingMessage.uuid);
			if (task instanceof Task) {
				this._tasks.delete(outgoingMessage.uuid);
				task.failureCallback(new Error('request timeout'));
			}
		}, this._config.timeout * 1000);
	}

	_connect() {
		this._status = STATUS_CONNECTING;
		this._socket = net.createConnection(this._config.port, this._config.host, () => {
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
			console.log(err);
		});
		this._socket.on('close', (hasError) => {
			this._close(hasError);
		});
	}

	_close(hasError) {
		console.log(new Error().stack);
		if (hasError) {
			this._socket.destroy();
		}
		else {
			this._socket.end();
		}
		this._status = STATUS_DISCONNECTED;

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
				if (task instanceof Task) {
					task.successCallback(incomingMessage.payload);
					this._tasks.delete(incomingMessage.uuid);
				}
			}
		}
	}
}
