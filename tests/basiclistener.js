var dbemitter = require('../main')
  , request = require('request')
  , child_process = require('child_process')
  ;

var db = 'http://localhost:5984/pizza'
  , h = {'content-type':'application/json', 'accept':'application/json'}
  ;
  
var emitter = dbemitter.createCouchDBEmitter(db);

emitter.on('change', function (change) {
  var doc = change.doc;
  console.log(JSON.stringify(change.seq));
})