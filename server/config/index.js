const opts = require('opts');

module.exports = class Config {
	static parse(config = undefined) {
		if (typeof config !== 'undefined') {
			return {
				host: (typeof config.host === 'undefined') ? 'localhost' : config.host,
				port: (typeof config.port === 'undefined') ? 8211 : config.port,
				timeout: (typeof config.timeout === 'undefined') ? 30 : config.timeout,
				logger: (typeof config.logger === 'undefined') ? null : config.logger,
				duration: (typeof config.duration === 'undefined') ? null : config.duration
			}
		}
		const opt = [
			{
				short: 'h',
				long: 'host',
				description: 'host to listen',
				value: true,
				required: false
			},
			{
				short: 'p',
				long: 'port',
				description: 'port to listen',
				value: true,
				required: true
			},
			{
				short: 't',
				long: 'timeout',
				description: 'maximum idle time of a connect client',
				value: true,
				required: false
			},
			{
				short: 'd',
				long: 'duration',
				description: 'second(s) of serving time, shutdown service afterward',
				value: true,
				required: false
			}
		];
		opts.parse(opt, [], true);

		return {
			host: (typeof opts.get('host') === 'undefined') ? 'localhost' : opts.get('host'),
			port: (typeof opts.get('port') === 'undefined') ? 8211 : parseInt(opts.get('port')),
			timeout: (typeof opts.get('timeout') === 'undefined') ? 30 : parseInt(opts.get('timeout')),
			duration: (typeof opts.get('duration') === 'undefined') ? null : parseInt(opts.get('duration'))
		};
	}
};