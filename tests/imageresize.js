var dbemitter = require('../main')
  , request = require('request')
  , child_process = require('child_process')
  , im = require('imagemagick')
  , sys = require("sys")
  , http = require("http")
  , url = require("url")
  , path = require("path")
  , fs = require("fs")
  , events = require("events")
  , base64_encode = require('base64').encode
  , Buffer = require('buffer').Buffer
  , mimetypes = require('./mimetypes')
  ;

var db = 'http://localhost:5984/pizza'
  , h = {'content-type':'application/json', 'accept':'application/json'}
  , converted = []
  ;
  
var emitter = dbemitter.createCouchDBEmitter(db);

emitter.on('change', function (change) {
  var doc = change.doc
    , attachments = doc._attachments
    ;
    
  if( attachments ) {
    for ( var attachment in attachments ) {
                      // && attachments[attachment].length > 1000000
      if ( doc.message ) {
        if ( converted.indexOf(doc._id) == -1 ) {
          converted.push(doc._id);
          console.log('about to resize ' + doc._id);
          resize(db + "/" + doc._id + "/" + attachment, doc);
        }
      } 
    }
  }
})

function download(uri, callback) {
  var filename = url.parse(uri).pathname.split("/").pop()
    ;
  console.log(uri)
  request({
    encoding: 'binary',
    uri: uri,
  }, function (err, resp, body) {
    if (err) throw err;
    if (resp.statusCode !== 201) throw new Error("Could not save new image\n"+body)
    fs.writeFileSync(filename, body, 'binary');
    console.log('wrote ' + filename);
    callback(filename);
  })   
}

function resize(uri, doc) {
  download(uri, function(filename) {
    im.convert([filename, '-resize', '700', filename], 
    function(err, stdout, stderr) {
      sys.puts("Converted: " + filename + " from " + doc._id);
      if (err) throw err;
      upload(filename, uri, doc);
    })
  })
}

function upload(filename, uri, doc) {
  fs.readFile(filename, 'binary', function (er, data) {
    if (er) return cb && cb(er);
    request({
      method: 'PUT',
      encoding: 'binary',
      uri: uri + '?rev=' + doc._rev,
      body: data,
    }, function (err, resp, body) {
      if (err) throw err;
      if (resp.statusCode !== 201) throw new Error("Could not save new image\n"+body)
    });
  });
}