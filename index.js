module.exports = class {
	static get Server() {
		return require('./server');
	}
	
	static get Message() {
		return require('./message');
	}

	static get Client() {
		return require('./client');
	}
}
