const TcpClient = require('../../client');

let client = new TcpClient({port:8211});
client.send(Buffer.from("hey yo"), (incomingMessage) => {
    console.log(incomingMessage.toString('utf8'));
}, (err) => {
    console.error(err);
});