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

function testEcho() {
	let server = new EchoServer();
	server.start();

	let client = new EchoClient();
	return client.send('hello, world', (response) => {
		assert(response === 'hello, world');
	}, (err) => {
		assert(false, "got an error");
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
	}, (err) => {
		assert(false, "got an error");
	});
}