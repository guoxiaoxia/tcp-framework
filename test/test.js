const TcpServer = require('../server');
const TcpServerHandler = require('../server/handler');
const TcpClient = require('../client');
const assert = require('assert');

class EchoHandler extends TcpServerHandler {
	static onReceived(socket, incomingMessage, outgoingCallback/* = (outgoingMessage)*/) {
		outgoingCallback(incomingMessage);
    }
}

class EchoClient extends TcpClient {
	constructor() {
		super({ port: 8211, timeout: 3 });
	}
}

describe('#echo', function() {
	it('should return [hello, world]', testEcho);
});
describe('#echoWithDelayedStartup', function() {
	this.timeout(5000);
	it('should return [hello, world]', testEchoWithDelayedStartup);
});

function testEcho() {
	let server = new TcpServer(EchoHandler, {port:8211});
	server.start();

	let client = new EchoClient();
	return client.send('hello, world', (response) => {
		assert(response === 'hello, world');
	});
}

function testEchoWithDelayedStartup() {
	setTimeout(() => {
		let server = new TcpServer(EchoHandler, {port:8211});
		server.start();
	}, 2000);

	let client = new EchoClient();
	return client.send('hello, world', (response) => {
		assert(response === 'hello, world');
	});
}