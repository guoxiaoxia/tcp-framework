const EchoInstantClient = require('../../../examples/echo/instant_client.js');

describe("#tcp-framework-instant", function() {
    this.timeout(5000);
    it('should return [hello, world]', async () => {
        let client = new EchoInstantClient();
        let response = await client.request('hello, world');
        assert(response === 'hello, world');
    });
});