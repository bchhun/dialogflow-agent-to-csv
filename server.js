
const idx = require('idx');
const path = require('path');
const utils = require('./src/utils');
const answers = require('./src/answers');
const trainingPhrases = require('./src/trainingPhrases');

const express = require('express');
const nunjucks = require('express-nunjucks');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, utils.AGENT_UPLOAD_PATH);
  },
  filename: function(req, file, cb) {
    cb(null, `${file.originalname.split('.')[0]}--${Date.now()}.zip`);
  },
});
const upload = multer({storage});

const app = express();
nunjucks(app, {});

app.set('views', __dirname + '/views');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.render('index');
});

app.post('/extract', upload.single('agentZipFile'), (request, response) => {
  const currentPath = idx(request, (_) => _.file.path);

  if (currentPath === undefined) {
    response.redirect(302, '/');
    return;
  }

  utils.unzipFile(currentPath).then((unzipPath) => {
    const agentName = path.basename(currentPath, '.zip');
    Promise.all([
      answers.extract(agentName, unzipPath, utils.AGENT_CSV_PATH),
      trainingPhrases.extract(agentName, unzipPath, utils.AGENT_CSV_PATH),
    ]).then(([answersFilename, trainingPhrasesFilename]) => {
      response.render('extracted', {
        answersFilename,
        trainingPhrasesFilename,
      });
    });
  }).catch((err) => {
    console.error(err);
    response.redirect(302, '/');
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT || 3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
