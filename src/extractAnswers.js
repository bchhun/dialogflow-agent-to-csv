const fs = require('fs-extra');
const idx = require('idx');

const utils = require('./utils');

const answersFilter = (f) => /usersays/g.test(f) === false;
const fields = ['intent', 'lang', 'answer'];
const noLineBreaksRegex = /(?:\r\n|\r|\n)/g;

exports.extractAnswers = function(agentName, uuid) {
  const intentsPath = ['public', 'agents', uuid, agentName, 'intents'];
  const csvContent = [];
  
  utils.getAllFilesFromPath(intentsPath, answersFilter).forEach((intentPath) => {
    if (intentPath.endsWith('json')) {
      const intentName = utils.extractIntentName(intentPath);
      const intent = JSON.parse(fs.readFileSync(intentPath));
      const messages = idx(intent, (_) => _.responses[0].messages);

      if (messages) {
        messages.filter((m) => m.type === 0).forEach(
          (m) => {
            let answer = m.speech;

            if (answer.constructor === Array) {
              if (answer.length === 0) {
                csvContent.push({
                  'intent': intentName,
                  'lang': m.lang,
                  'answer': '',
                });
              } else {
                answer.forEach(
                  (a) => {
                    csvContent.push({
                      'intent': intentName,
                      'lang': m.lang,
                      'answer': a.replace(noLineBreaksRegex, ' '),
                    });
                  }
                );
              }
            } else {
              csvContent.push({
                'intent': intentName,
                'lang': m.lang,
                'answer': answer.replace(noLineBreaksRegex, ' '),
              });
            }
          }
        );
      }
    }
  });

  const options = {fields};
  const filename = `${agentName}.answers.csv`;

  return utils.writeCsvFile(options, csvContent, filename);
}
