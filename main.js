var request = require('request')
  , events = require('events')
  , querystring = require('querystring')
  ;

var createCouchDBEmitter = function (uri) {
  if (uri[uri.length - 1] !== '/') uri += '/'
  var changesStream = new events.EventEmitter();
  changesStream.since = 0;
  
  changesStream.on('change', function (c) {
    if (c.seq) changesStream.since = c.seq;
    if (c.last_seq) changesStream.since = c.last_seq;
  })
  
  changesStream.buffer = '';
  changesStream.write = function (chunk) {
    var line
      , change
      ;
    changesStream.buffer += chunk.toString();
    while (changesStream.buffer.indexOf('\n') !== -1) {
      line = changesStream.buffer.slice(0, changesStream.buffer.indexOf('\n'));
      if (line.length > 1) {
        change = JSON.parse(line);
        if (change.last_seq) changesStream.since = change.last_seq;
        else changesStream.emit('change', change);
      }
      changesStream.buffer = changesStream.buffer.slice(changesStream.buffer.indexOf('\n') + 1)
    }
  };
  changesStream.end = function () {};
  
  var connect = function () {
    var qs = querystring.stringify({include_docs: "true", feed: 'continuous', since: changesStream.since});
    request({ uri: uri+'_changes?'+qs
            , responseBodyStream: changesStream
            , headers: {'content-type':'application/json', connection:'keep-alive'}
            }, function (err, resp, body) {
      if (resp.statusCode !== 200) throw new Error('Request did not return 200.\n'+body.buffer);
      connect();
    });
  }
  connect();  
  return changesStream;
}

exports.createCouchDBEmitter = createCouchDBEmitter;