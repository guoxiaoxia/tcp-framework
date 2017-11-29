const EchoPersistentClient = require('../../../examples/echo/persistent_client.js');

describe("#tcp-framework-persistent", function() {
    this.timeout(5000);

    it('should return [hello, world]', async () => {
        let client = new EchoPersistentClient();
        let response = await client.request('hello, world');
        assert(response === 'hello, world');
    });
});

