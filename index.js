var handlebars = require('handlebars')
  , lru = require('lru-cache')
  , path = require('path')
  , fs = require('fs')
  , _debug
  ;

var cache = lru()
  , listeners = {}
  ;

function listen (_path) {
  function l () {
    cache.del(_path)
  }
  if (!listeners[_path]) {
    fs.watchFile(_path, l)
    listeners[_path] = l
  }
}

module.exports = function (_path, opts, context, cb) {
  if (!cb) {
    cb = context
    context = opts
    opts = {}
  }

  _path = path.normalize(_path)
  if (!cache.has(_path)) {
    fs.readFile(_path, function (e, buffer) {
      if (e) return cb(e)
      if (_debug) listen(_path)
      cache.set(_path, handlebars.compile(buffer.toString(), opts))
      cb(null, cache.get(_path)(context))
    })
  } else {
    setImmediate(function () {
      cb(null, cache.get(_path)(context))
    })
  }
}
module.exports.flush = function (_path) {
  if (!_path) cache.reset()
  else cache.del(_path)
}
module.exports.debug = function () {
  if (!_debug) {
    _debug = true
    cache.keys().forEach(function (k) {
      listen(k)
    })
  }
}