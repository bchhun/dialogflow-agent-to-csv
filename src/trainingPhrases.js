const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

const userSaysFilter = (f) => /usersays/g.test(f) === true;
const fields = ['intent', 'lang', 'training phrase'];

const readFileWrapper = (userSaysPath) => {
  const lang = utils.extractLang(userSaysPath);
  const intentName = utils.extractIntentName(userSaysPath);

  return new Promise((resolve, reject) => {
    fs.readFile(userSaysPath).then((content) => {
      resolve([intentName, lang, content]);
    }).catch((error) => {
      reject(error);
    });
  });
};

exports.extract = (agentName, agentFolder, destination) => {
  const intentsPath = agentFolder.concat('intents');
  const csvContent = [];
  let allReadFiles = [];

  return new Promise((resolve, reject) => {
    allReadFiles = utils.getAllFilesFromPath(intentsPath, userSaysFilter)
        .map((userSaysPath) => readFileWrapper(userSaysPath));

    Promise.all(allReadFiles).then((results) => {
      results.forEach(([intentName, lang, content]) => {
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
      resolve(csvContent);
    }).catch((error) => reject(error));
  }).then((csvContent) => {
    const options = {fields};
    const filename = destination.concat(`${agentName}.training-phrases.csv`);
    return utils.writeCsvFile(options, csvContent, filename.join(path.sep));
  });
};
