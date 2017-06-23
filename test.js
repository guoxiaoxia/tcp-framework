const TcpServer = require('../server');
const TcpClient = require('../client');
const TextCodec = require('../codec/text');
const assert = require('assert');

class EchoServer extends TcpServer {
	constructor() {
		super({ port: 12345 });
		this.handle = (incomingPayload, outgoingCallback) => {
			outgoingCallback(incomingPayload);
		};
		this.incomingCodec = TextCodec;
		this.outgoingCodec = TextCodec;
	}
}

class OverloadedEchoServer extends TcpServer {
	constructor() {
		super({ port: 12345 });
		this.handle = (incomingPayload, outgoingCallback) => {
			setTimeout(() => {
				outgoingCallback(incomingPayload);
			}, 10000);
		};
		this.incomingCodec = TextCodec;
		this.outgoingCodec = TextCodec;
	}
}

class EchoClient extends TcpClient {
	constructor() {
		super({ port: 12345, timeout: 3 });
		this.incomingCodec = TextCodec;
		this.outgoingCodec = TextCodec;
	}
}

describe('#echo', function() {
	it('should return [hello, world]', testEcho);
});
describe('#echoWithDelayedStartup', function() {
	this.timeout(5000);
	it('should return [hello, world]', testEchoWithDelayedStartup);
});
describe('#echoWithOverloaded', function() {
	this.timeout(5000);
	it('should return error', testEchoWithOverloaded);
});
function testEcho() {
	let server = new EchoServer();
	server.start();

	let client = new EchoClient();
	return client.send('hello, world', (response) => {
		assert(response === 'hello, world');
	});
}

function testEchoWithDelayedStartup() {
	setTimeout(() => {
		let server = new EchoServer();
		server.start();
	}, 2000);

	let client = new EchoClient();
	return client.send('hello, world', (response) => {
		assert(response === 'hello, world');
	});
}

function testEchoWithOverloaded() {
	let server = new OverloadedEchoServer();
	server.start();

	let client = new EchoClient();
	return client.send('hello, world', (response) => {
		throw new Error('should not receive anything')
	}, (err) => {
		console.log(err);
	});
}