var dns = require('dns')
  , net = require('net')
  , events = require('events')
  ;

function getexchange (domain, cb) {
  dns.resolveMx(domain, function (err, addresses) {
    if (err) return cb(err);
    var resolver = {}
    addresses.reverse();
    for (var i=0;i<addresses.length;i++) {
      resolver[addresses[i].priority] = addresses[i].exchange;
    }
    var keys = Object.keys(resolver)
    keys.sort()
    cb(null, resolver[keys[0]])
  })
}

getexchange('couchone.com', function (err, exchange) {
  console.log(ex)
})

function createSmtpClient (domain, cb) {
  getexchange(domain, function (err, exchange) {
    if (err) return cb(err);
    
    var client = new events.EventEmitter();
    client.stream = net.Stream();
    client.stream.host = domain;
    client.stream.post = 25;
    client.stream.on('connect', function () {
      client.kick();
    })

    client.waiting = false;
    client.eof = '\r\n'
    client.stream.on('data', function (chunk) {

    })

    client.queue = [['HELO '+exchange, function (err) {if (err) cb(err)}]];
    client.currentCallback = function (code, line) {
      if (code > 299) return cb(new Error({code:code, message:line}));
      client.kick();
    }
    client.kick = function () {
      var c = client.queue.shift();
      client.stream.write(c[0])
      client.currentCallback = function (code, line) {
        if (c[1]) c[1](null, code, line);
        client.kick();
      }
    }
  })
}

