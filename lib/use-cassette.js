'use strict';

var RSVP      = require('rsvp');
var nock      = require('nock');
var path      = require('path');
var fs        = require('fs');
var mkdirp    = RSVP.denodeify(require('mkdirp'));
var writeFile = RSVP.denodeify(fs.writeFile);

module.exports = function(cassette, options, test) {
  var fixturePath = path.resolve(
    path.join(options.cassetteLibraryDir, cassette + '.json')
  );

  return beforeTest(fixturePath, options).then(function() {
    return test();
  }).then(function(res) {
    return afterTest(fixturePath, options).then(function() {
      return res;
    });
  }, function(err) {
    if (options.writeOnFailure) {
      return afterTest(fixturePath, options);
    }

    return RSVP.reject(err);
  });
};

function beforeTest(fixturePath, options) {
  nockReset();

  if (options.mode === 'all') {
    nockStartRecording();
    return RSVP.resolve();
  }

  return new RSVP.Promise(function(resolve) {
    fs.exists(fixturePath, function(exists) {
      if (exists) {
        nock.load(fixturePath);
      } else {
        nockStartRecording();
      }

      return resolve();
    });
  });
}

function afterTest(fixturePath, options) {
  var fixtures = nock.recorder.play();

  if (fixtures.length) {
    fixtures = removeExcludedScopeFromArray(fixtures, options.excludeScope);

    return mkdirp(path.dirname(fixturePath)).then(function() {
      return writeFile(fixturePath, JSON.stringify(fixtures, null, 2));
    });
  }

  return RSVP.resolve();
}

function nockReset() {
  nock.cleanAll();
  nock.recorder.clear();
  nock.restore();
}

function nockStartRecording() {
  return nock.recorder.rec({
    output_objects:  true,
    dont_print:      true
  });
}

function removeExcludedScopeFromArray(fixtureArray, scope) {
  scope = [].concat(scope);

  if (!scope.length) {
    return fixtureArray;
  }

  return fixtureArray.reduce(function(result, fixture) {
    var shouldExclude = scope.some(function(url) {
      return fixture.scope.indexOf(url) > -1;
    });

    if (!shouldExclude) {
      result.push(fixture);
    }

    return result;
  }, []);
}
