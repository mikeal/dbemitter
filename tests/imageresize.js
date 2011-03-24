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
  ;

var db = 'http://localhost:5984/pizza'
  , h = {'content-type':'application/json', 'accept':'application/json'}
  ;
  
var emitter = dbemitter.createCouchDBEmitter(db);

emitter.on('change', function (change) {
  var doc = change.doc
    , attachments = doc._attachments
    ;
    
  if( attachments ) {
    for ( var attachment in attachments ) {
      resize(db + "/" + doc._id + "/" + attachment);
    }
  }
})

function resize(uri) {
  download(uri, function(filename) {
    im.convert([filename, '-resize', '700', filename], 
    function(err, stdout, stderr) {
      if (err) throw err;
      upload(filename, uri);
    })
  })
}

function download(uri, callback) {
  var host = url.parse(uri).hostname
    , filename = url.parse(uri).pathname.split("/").pop()
    , port = url.parse(uri).port
    ;
  
  var theurl = http.createClient(port, host);
  var requestUrl = uri;
  sys.puts("Downloading file: " + filename);
  var request = theurl.request('GET', requestUrl, {"host": host});
  request.end();
  
  request.addListener('response', function (response) {
    response.setEncoding("binary");
    sys.puts("File size " + filename + ": " + response.headers['content-length'] + " bytes.");
    var body = '';
    response.addListener('data', function (chunk) {
      body += chunk;
    });
    response.addListener("end", function() {
      fs.writeFileSync(filename, body, 'binary');
      callback(filename);
    });
  });
}

var toAttachment = function(file, cb) {
  fs.readFile(file, 'binary', function (er, data) {
    if (er) return cb && cb(er, data);
    var ext = path.extname(file).substr(1);
    var buf = new Buffer(data);
    cb && cb(null, {
      content_type: mime.lookup(ext),
      data: base64_encode(buf)
    });
  })
};


function upload(filename, uri) {
  
}