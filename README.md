# Nock VCR Recorder [![Build Status](https://travis-ci.org/poetic/nock-vcr-recorder.svg?branch=master)](https://travis-ci.org/poetic/nock-vcr-recorder)

A test framework agnostic vcr implementation that uses
[nock](https://github.com/pgte/nock). Can be used in isolation or test specific
libraries can be written around it.

## Install

```bash
npm install --save-dev nock-vcr-recorder
```

## Usage

Use `vcr.useCassette` and pass in a callback with the test to run. All http
requests will be recorded using nock and stored in a cassettes directory for
playback on later test runs. It expects the callback to return a promise for
asyncronous actions and it returns a promise that resolves when it's finished.

Example using mocha:

```js
var RSVP    = require('rsvp');
var request = RSVP.denodeify(require('request'));
var assert  = require('assert');
var vcr     = require('nock-vcr-recorder');

describe('standard test', function() {
  it('caches request', function() {
    return vcr.useCassette('normal test - works', function() {
      return request('http://localhost:4000/users').then(function() {
        assert(true, 'request works');
      });
    });
  });
});

// Usage with test specific options
//
// This test will not record the request to localhost:4000 and it will not use
// any saved fixtures
describe('normal test', function() {
  it('works', function(done) {
    return vcr.useCassette('normal test - works', {
      excludeScope: 'localhost:4000'
      mode: 'all'
    }, function() {
      return request('http://localhost:4000/users').then(function() {
        assert(true, 'request works');
      });
    });
  });
});
```

You can also call `vcr.nockReset()` if you need to programmatically remove all mocks.

## Configuration

Defaults:

```js
{
  // Don't record any requests to this scope
  // It can be an array or string
  excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],

  // Re-record and overwrite your current fixtures
  // Possible values: 'all'
  mode: undefined, 

  // Write recorded fixtures when the test fails. We don't do this by default
  writeOnFailure: false
}
```

To overide these you can call `vcr.config` with an object to
override them for ALL tests.

You also are able to pass in test specific options as the second parameter to
`vcr.useCassette()`. See the "Usage" section above for an example.


## Authors ##

* [Jake Craige](http://twitter.com/jakecraige)

## Versioning

This library follows [Semantic Versioning](http://semver.org)

## Want to help?

Please do! We are always looking to improve this library. If you have any ideas
please open an issue or a pull requests and we'll work on getting them in.

## Legal

[Poetic Systems](http://poeticsystems.com), Inc &copy; 2014

[@poeticsystems](http://twitter.com/poeticsystems)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)

