const fs = require('fs-extra');
const utils = require('./utils');

const userSaysFilter = (f) => /usersays/g.test(f) === true;
const fields = ['intent', 'lang', 'training phrase'];

exports.extractTrainingPhrases = function(agentName, uuid) {
  const intentsPath = ['public', 'agents', uuid, agentName, 'intents'];
  const csvContent = [];
  
  utils.getAllFilesFromPath(intentsPath, userSaysFilter).forEach((usersaysPath) => {
    if (usersaysPath.endsWith('json')) {
      const lang = utils.extractLang(usersaysPath);
      const intentName = utils.extractIntentName(usersaysPath);
      const userSays = JSON.parse(fs.readFileSync(usersaysPath));

      userSays.forEach((u) => {
        const trainingPhrase = () => {
          return u.data.map((d) => d.text);
        };

        csvContent.push({
          'intent': intentName,
          lang,
          'training phrase': trainingPhrase().join(''),
        });
      });
    }
  });

  const options = {fields};
  const filename = `${agentName}.training-phrases.csv`;

  return utils.writeCsvFile(options, csvContent, filename);
} 

