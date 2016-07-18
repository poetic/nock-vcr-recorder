'use strict';

var RSVP      = require('rsvp');
var nock      = require('nock');
var path      = require('path');
var fs        = require('fs');
var mkdirp    = RSVP.denodeify(require('mkdirp'));
var writeFile = RSVP.denodeify(fs.writeFile);

module.exports = function(cassette, options, testFn) {
  var cassettePath = path.resolve(
    path.join(options.cassetteLibraryDir, cassette + '.json')
  );

  beforeTest(cassettePath, options);

  var testRun = testFn();

  if (isPromise(testRun)) {
    return testRun.then(function(res) {
      return afterTest(cassettePath, options).then(function() {
        return res;
      });
    }, function(err) {
      if (options.writeOnFailure) {
        return afterTest(cassettePath, options);
      }

      return RSVP.reject(err);
    });
  }

  return RSVP.resolve(testRun);
};

function beforeTest(cassettePath, options) {
  nockReset();

  // I feel like this could be written better. Some duplication here
  if (options.mode === 'all') {
    nockStartRecording();
  } else if (fs.existsSync(cassettePath)) {
    if (!nock.isActive()) {
      nock.activate();
    }

    nock.load(cassettePath);
  } else {
    nockStartRecording();
  }
}

function afterTest(cassettePath, options) {
  var cassettes = nock.recorder.play();

  if (cassettes.length) {
    cassettes = removeExcludedScopeFromArray(cassettes, options.excludeScope);

    return mkdirp(path.dirname(cassettePath)).then(function() {
      return writeFile(cassettePath, JSON.stringify(cassettes, null, 2));
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

function removeExcludedScopeFromArray(cassettes, scope) {
  scope = [].concat(scope);

  if (!scope.length) {
    return cassettes;
  }

  return cassettes.reduce(function(result, cassette) {
    var shouldExclude = scope.some(function(url) {
      return cassette.scope.indexOf(url) > -1;
    });

    if (!shouldExclude) {
      result.push(cassette);
    }

    return result;
  }, []);
}

function isPromise(object) {
  return object && typeof object.then === 'function';
}

module.exports.nockReset = nockReset;
