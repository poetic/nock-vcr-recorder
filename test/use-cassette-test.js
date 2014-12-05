var path    = require('path');
var fs      = require('fs');
var RSVP    = require('rsvp');
var mkdirp  = require('mkdirp');
var request = RSVP.denodeify(require('request'));
var app     = require('./app');
var vcr     = require('../lib/vcr');
var assert  = require('assert');

describe('vcr.useCassette - callback promises', function() {
  it('resolves', function() {
    return vcr.useCassette('record handles resovled promises', function() {
      return RSVP.resolve();
    }).then(function() {
      assert.ok(true, 'returned a promise');
    }, function() {
      assert.ok(false, 'returned an error');
    });
  });

  it('rejects', function() {
    return vcr.useCassette('record handles rejected promises', function() {
      return RSVP.reject();
    }).then(function() {
      assert.ok(false, 'returned an error');
    }, function() {
      assert.ok(true, 'returned a promise');
    });
  });
});

describe('vcr.useCassette - requests - playback', function() {
  var called;

  before(function(done) {
    called = 0;

    mockRecordedCassette('plays back request');

    app.get('/shouldnt-be-called', function(req, res) {
      called++;
      res.send('ok');
    });

    // Actual test
    app.listen(4007, done);
  });

  it('plays back cached requests', function() {
    vcr.useCassette('plays back request', function() {
      return request('http://localhost:4007/shouldnt-be-called');
    }).then(function() {
      assert.equal(called, 0, 'should not have been called');
    });
  });
});


describe('vcr.useCassette - requests - recording', function() {
  before(function(done) {
    app.listen(4006, done);
  });

  it('saves a cassette with the server response', function() {
    return vcr.useCassette('real request', function() {
      return request('http://localhost:4006/test');
    }).then(function() {
      assertCassette('real request');
    });
  });

  it('doesn\'t save a file when no requests are made', function() {
    return vcr.useCassette('no file with no request', function() {
      return assert(true);
    }).then(function() {
      assertNotCassette('no file with no request');
    });
  });

  it('excludes array of urls', function() {
    return vcr.useCassette('excludeScope array', {
      excludeScope: ['poeticsystems.com', 'github.com']
    }, function() {
      return request('https://github.com/poetic.json');
    }).then(function() {
      var cassette = readCassette('excludeScope array');

      assert.equal(cassette.length, 0);
    });
  });

  it('excludes a string url', function() {
    return vcr.useCassette('excludeScope string', {
      excludeScope: 'github.com'
    }, function() {
      return request('https://github.com/poetic.json');
    }).then(function() {
      var cassette = readCassette('excludeScope string');

      assert.equal(cassette.length, 0);
    });
  });

  describe('all mode', function() {
    before(function() {
      vcr.config({excludeScope: []});
      mockRecordedCassette('overwrites existing cassette');
    });

    it('overwrites existing cassette', function() {
      return vcr.useCassette('overwrites existing cassette', {
        mode: 'all'
      }, function() {
        return request('http://localhost:4006/test');
      }).then(function() {
        var cassette = readCassette('overwrites existing cassette');

        assert.equal(cassette.length, 1, '0 !== 1 : recorded one request');
        assert.equal(cassette[0].response, 'ok');
      });
    });
  });

  describe('writeOnFailure', function() {
    it('doesnt save when test fails', function() {
      return vcr.useCassette('doesnt save when test fails', {
        writeOnFailure: false
      }, function() {
        return request('http://localhost:4006/test').then(function() {
          return RSVP.reject('mock failed test');
        });
      }).then(null, function() {
        assertNotCassette('doesnt save when test fails');
      });
    });

    it('saves when test fails', function() {
      return vcr.useCassette('saves when test fails', {
        writeOnFailure: true
      }, function() {
        return request('http://localhost:4006/test').then(function() {
          return RSVP.reject('mock failed test');
        });
      }).then(null, function() {
        assertCassette('saves when test fails');
      });
    });
  });
});

function mockRecordedCassette(name) {
  var fileContents = fs.readFileSync(
    path.join(__dirname, 'test-cassettes', name + '.json'),
    { encoding: 'utf8' }
  );
  var filePath = cassettePath(name);
  mkdirp.sync(path.dirname(filePath));
  fs.writeFileSync(filePath, fileContents);
}

function readCassette(name) {
  return JSON.parse(
    fs.readFileSync(cassettePath(name), { encoding: 'utf8' })
  );
}

function assertCassette(name) {
  assert(fs.existsSync(cassettePath(name)),
         'cassette "' + name + '" should exist');
}

function assertNotCassette(name) {
  assert(!fs.existsSync(cassettePath(name)),
         'cassette "' + name + '" shouldn\'t exist');
}

function cassettePath(name) {
  return path.resolve(
    path.join(vcr._config.cassetteLibraryDir, name + '.json')
  );
}
