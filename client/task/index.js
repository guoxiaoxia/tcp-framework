module.exports = class {
	constructor(message, successCallback, failureCallback) {
		this._message = message;
		this._successCallback = successCallback;
		this._failureCallback = failureCallback;
	}

	get message() {	return this._message; }
	get successCallback() { return this._successCallback; }
	get failureCallback() { return this._failureCallback; }
};