var Promise = require('bluebird');
var assert  = require('assert');
var vcr     = require('../lib/vcr');

describe('vcr - config', function() {
  beforeEach(function() {
    // Reset to default config
    vcr._config = {
      excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],
      cassetteLibraryDir: 'cassettes'
    };
  });

  it('#config changes default', function() {
    assert.deepEqual(vcr._config, {
      excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],
      cassetteLibraryDir: 'cassettes'
    });

    vcr.config({ cassetteLibraryDir: 'test/cassettes' });

    assert.deepEqual(vcr._config, {
      excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],
      cassetteLibraryDir: 'test/cassettes'
    });
  });

  it('cassette specific config doesn\'t modify global default', function() {
    return vcr.useCassette('test config', {
      excludeScope: ['github.com']
    }, function() {
      return Promise.resolve();
    }).then(function() {
      assert.deepEqual(vcr._config, {
        excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],
        cassetteLibraryDir: 'cassettes'
      });
    });
  });
});
