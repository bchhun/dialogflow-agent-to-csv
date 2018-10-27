const path = require('path');
const AGENT_UPLOAD_PATH = process.env.AGENT_UPLOAD_PATH || '/tmp';
const AGENT_UNZIP_PATH = [AGENT_UPLOAD_PATH, 'unzipped'];
const AGENT_CSV_PATH = [AGENT_UPLOAD_PATH, 'csv'];

const fs = require('fs-extra');
const util = require('util');
const json2csv = require('json2csv');
const unzipper = require('unzipper');

fs.mkdirs(AGENT_CSV_PATH.join(path.sep), (err) => {
  if (err) return console.error(err);
  console.log(`csv path ${AGENT_CSV_PATH.join(path.sep)} created successfully`);
});

const dirExists = (folderPath) => {
  const resolvedPath = path.resolve(...folderPath);
  return fs.existsSync(resolvedPath);
};

const getAbsolutePath = (folders, filename = null) => {
  let completePath = folders;

  if (!util.isNull(filename)) {
    completePath = folders.concat([filename]);
  }

  return path.resolve(...completePath);
};

exports.errorMsg = (msg) => {
  console.log('***');
  console.log(msg);
  console.log('***');
};

exports.getAbsolutePath = getAbsolutePath;

exports.extractLang = (userSaysPath) => {
  const basename = path.basename(userSaysPath, '.json');
  const fragmentWithLang = basename.split('.').pop();
  const lang = fragmentWithLang.split('_').pop();

  return lang;
};

exports.extractIntentName = (currentPath) => {
  const basename = path.basename(currentPath, '.json');

  if (basename.indexOf('_usersays') > -1) {
    return basename.split('_usersays').shift();
  }

  return basename;
};

exports.getAllFilesFromPath = (dirPath, filterFunc = null) => {
  if (!dirExists(dirPath)) {
    throw new Error(`${dirPath.toString()} does not exists`);
  }

  const absolutePath = getAbsolutePath(dirPath);
  const noDotfiles = (f) => f.startsWith('.') === false;
  const jsonFilesOnly = (f) => f.endsWith('json') === true;
  const extractAbsolutePath = (f) => getAbsolutePath(dirPath.concat([f]));

  const files = fs.readdirSync(absolutePath)
      .filter(noDotfiles)
      .filter(jsonFilesOnly)
      .map(extractAbsolutePath);

  return util.isNullOrUndefined(filterFunc) ? files: files.filter(filterFunc);
};

exports.writeCsvFile = (options, csvContent, filename) => {
  return new Promise((resolve, reject) => {
    const csv = json2csv.parse(csvContent, options);

    fs.writeFile(filename, csv, 'utf8').then(() => {
      resolve(filename);
    }).catch((error) => {
      console.error(error);
    });
  });
};

exports.unzipFile = (pathToZipFile) => {
  return new Promise((resolve, reject) => {
    const filename = path.basename(pathToZipFile, '.zip');
    const unzipPath = [...AGENT_UNZIP_PATH, filename];
    const extractOptions = {
      path: unzipPath.join(path.sep),
    };

    fs.createReadStream(pathToZipFile)
        // eslint-disable-next-line new-cap
        .pipe(unzipper.Extract(extractOptions))
        .on('close', () => {
          resolve(unzipPath);
        })
        .on('error', (error) => {
          reject(error);
        });
  });
};

exports.deleteZipFiles = () => {
  const extractAbsPath = (f) => getAbsolutePath([AGENT_UPLOAD_PATH].concat(f));
  const zipFilesOnly = (f) => f.endsWith('zip') === true;
  const files = fs.readdirSync(AGENT_UPLOAD_PATH)
      .filter(zipFilesOnly)
      .map(extractAbsPath);

  files.forEach((f) => {
    fs.unlink(f, (err) => {
      if (!!err) {
        throw err;
      }
    });
  });
};

exports.AGENT_UPLOAD_PATH = AGENT_UPLOAD_PATH;
exports.AGENT_UNZIP_PATH = AGENT_UNZIP_PATH;
exports.AGENT_CSV_PATH = AGENT_CSV_PATH;
