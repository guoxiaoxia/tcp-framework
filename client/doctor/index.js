const Message = require('../../message');

const INTERVAL = 25;
const TIMEOUT = 60;

module.exports = class {
	constructor(client) {
		this._client = client;
		this._timerPacer = null;
		this._timerCheckup = null;
		this._activeTime = 0;
	}

	start() {
		this._timerPacer = setInterval(() => {
			let outgoingMessage = new Message(Message.SIGN_PING);
			this._client._socket.write(outgoingMessage.toBuffer());
		}, INTERVAL * 1000);

		this._timerCheckup = setInterval(() => {
			let currentTime = new Date().getTime();
			if ((this._activeTime + TIMEOUT * 1000) < currentTime) {
				if (this._timerPacer !== null) {
					clearInterval(this._timerPacer);
					this._timerPacer = null;
				}
				if (this._timerCheckup !== null) {
					clearInterval(this._timerCheckup);
					this._timerCheckup = null;
				}
				this._client._close(true);
			}
		}, 1000);

		this.yelp();
	}

	yelp() {
		this._activeTime = new Date().getTime();
	}
}