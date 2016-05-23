var defaults    = require('lodash/defaults');
var assign      = require('lodash/assign');
var useCassette = require('./use-cassette');

module.exports = {
  useCassette: function(cassette, options, cb) {
    if (arguments.length < 2) {
      throw new Error('You must provide at least a cassette name and a callback');
    } else if (arguments.length === 2 && typeof options === 'function') {
      cb  = options;
      options = {};
    }

    return useCassette(cassette, assign({}, this._config, options), cb);
  },

  _config: {
    excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],
    cassetteLibraryDir: 'cassettes',
    writeOnFailure: false
  },

  config: function(newConfig) {
    this._config = defaults(newConfig, this._config);
  }
}
