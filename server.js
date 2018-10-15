
const idx = require('idx');
const utils = require('./src/utils');
const extractAnswers = require('./src/extractAnswers');
const extractTrainingPhrases = require('./src/extractTrainingPhrases');

const express = require('express');
const exphbs  = require('express-handlebars');
const fs = require('fs-extra');

const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, utils.AGENT_UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname.split('.')[0]}--${Date.now()}.zip`);
  }
});
const upload = multer({ storage });

const app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.render('index');
});

app.post('/extract', upload.single('agentZipFile'), function(request, response) {
  const currentPath = idx(request, (_) => _.file.path);

  if(currentPath === undefined) {
    response.redirect(302, '/');
    return;
  }

  utils.unzipFile(currentPath).then((unzippedPath) => {
    console.log(unzippedPath);
    response.render('extracted');
  }).catch((err) => {
    console.error(err);
    response.redirect(302, '/');
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT || 3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
