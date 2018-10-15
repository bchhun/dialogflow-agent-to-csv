const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

const userSaysFilter = (f) => /usersays/g.test(f) === true;
const fields = ['intent', 'lang', 'training phrase'];

exports.extract = (agentName, agentFolder, destination) => {
  const intentsPath = agentFolder.concat('intents');
  const csvContent = [];

  return new Promise((resolve, reject) => {
    utils.getAllFilesFromPath(
        intentsPath,
        userSaysFilter
    ).forEach((usersaysPath) => {
      const lang = utils.extractLang(usersaysPath);
      const intentName = utils.extractIntentName(usersaysPath);

      fs.readFile(usersaysPath).then((content) => {
        const userSays = JSON.parse(content);
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
      });
    });
    resolve(csvContent);
  }).then((csvContent) => {
    const options = {fields};
    const filename = destination.concat(`${agentName}.training-phrases.csv`);
    return utils.writeCsvFile(options, csvContent, filename.join(path.sep));
  });
};
