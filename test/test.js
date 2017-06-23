const EchoClient = require('../examples/echo/client');
const EchoServer = require('../examples/echo/server');
const assert = require('assert');

describe('#echo', function() {
	it('should return [hello, world]', testEcho);
});
describe('#echoWithDelayedStartup', function() {
	this.timeout(5000);
	it('should return [hello, world]', testEchoWithDelayedStartup);
});

async function testEcho() {
	let server = new EchoServer();
	server.start();

	let client = new EchoClient();
	let response = await client.send('hello, world');
	assert(response === 'hello, world');
}

async function testEchoWithDelayedStartup() {
	setTimeout(() => {
		let server = new EchoServer();
		server.start();
	}, 2000);

	let client = new EchoClient();
	let response = await client.send('hello, world');
	assert(response === 'hello, world');
}