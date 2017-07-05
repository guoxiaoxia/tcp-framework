const EchoClient = require('../examples/echo/client');
const EchoServer = require('../examples/echo/server');
const assert = require('assert');

describe("#tcp-framework", function() {
	it('should return [hello, world]', testEcho);
})

async function testEcho() {
	let server = new EchoServer();
	server.start();

	let client = new EchoClient();
	let response = await client.request('hello, world');
	assert(response === 'hello, world');
}