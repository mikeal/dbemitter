var dbemitter = require('../main')
  , request = require('request')
  , child_process = require('child_process')
  ;

var db = 'http://localhost:5984/testemailer'
  , h = {'content-type':'application/json', 'accept':'application/json'}
  ;
  
  // to:recipient@somewhere.com
  // from:you@yourdomain.com
  // subject:Testing 123
  // 
  // This is my message.
  
var sendEmail = function (from, to, subject, body, callback) {
  var text = 
    'to:' + to + '\n' +
    'from:' + from + '\n' +
    'subject:' + subject + '\n' +
    '\n' +
    body +
    '\r\n\r\n'
    ;
  var sendmail = child_process.spawn('sendmail', ['-v', '-q', '-t'])
    , stdout = ''
    , stderr = ''
    ;
  
  sendmail.stdout.on('data', function (chunk) {stdout += chunk});
  sendmail.stderr.on('data', function (chunk) {stderr += chunk});
  
  sendmail.stdin.write(text)
  sendmail.stdin.end();
  sendmail.on('exit', function (code) {callback(code, stdout, stderr)});
}

// sendEmail('mikeal.rogers@gmail.com', 'mikeal.rogers@gmail.com', 'Test', "Test Body", function (code, stdout, stderr) {
//   console.log(code); console.log(stdout); console.log(stderr);
// });

var c = dbemitter.createCouchDBEmitter(db)
c.on('change', function (change) {
  console.log('change '+change.seq)
  var doc = change.doc;
  if (doc.type === 'email' && doc.status === 'pending') {
    doc.status = 'sending';
    doc.statusChangeTimestamp = new Date();
    request({uri:db, body:JSON.stringify(doc), headers:h, method:'POST'}, function (err, resp, body) {
      if (err) throw err;
      if (resp.statusCode !== 201) throw new Error('Could not update document.');
      doc._rev = JSON.parse(body).rev;
      console.log('sending email...')
      sendEmail(doc.from, doc.to, doc.subject, doc.body, function (code, stdout, stderr) {
        if (code === 0) {
          doc.status = 'sent'
          doc.result = {code:code, stdout:stdout, stderr:stderr}
        } else {
          doc.status = 'error';
          doc.error = {code:code, stdout:stdout, stderr:stderr}
        }
        request({uri:db, body:JSON.stringify(doc), headers:h, method:'POST'}, function (err, resp, body) {
          if (err) throw err;
          if (resp.statusCode !== 201) throw new Error('Could not update document.')
          
          if (!doc.error) console.log('email sent to '+doc.to)
          else console.log('error sending email.')
        })
      })
    })
  }
})
