const path = require('path');
const AGENT_UPLOAD_PATH = process.env.AGENT_UPLOAD_PATH || '/tmp';
const AGENT_UNZIP_PATH = [AGENT_UPLOAD_PATH, 'unzipped'].join(path.sep);

const fs = require('fs-extra');
const util = require('util');
const json2csv = require('json2csv');
const unzip = require('unzip');


const dirExists = (folderPath) => {
  let resolvedPath = path.resolve(...folderPath);
  return fs.existsSync(resolvedPath);
};

const getAbsolutePath = (folders, filename = null) => {
  let completePath = folders;

  if (!util.isNull(filename)) {
    completePath = folders.concat([filename]);
  }

  return path.resolve(...completePath);
};

exports.getView = function(templateName, context = {}) {
  // foo
}

exports.errorMsg = (msg) => {
  console.log('***');
  console.log(msg);
  console.log('***');
};

exports.getAbsolutePath;

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

  let files = fs.readdirSync(absolutePath)
      .filter(noDotfiles)
      .filter(jsonFilesOnly)
      .map(extractAbsolutePath);

  return util.isNullOrUndefined(filterFunc) ? files: files.filter(filterFunc);
};

exports.writeCsvFile = (options, csvContent, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const csv = json2csv.parse(csvContent, options);
      fs.writeFileSync(filename, csv, 'utf8');
      resolve(filename);
    } catch (err) {
      reject(err);
    };
  })
  
};

exports.unzipFile = function(path) {
  const readStream = fs.createReadStream(path);
  const writeStream = fs.createWriteStream(AGENT_UNZIP_PATH);
  
  try {
    readStream.pipe(unzip.Parse()).pipe(writeStream);
  } catch (err) {
    return false;
  }
  
  return true;
}

/*
 * delete all zip files in the AGENT_UPLOAD_PATH folder
 */
exports.deleteZipFiles = function() {
  const extractAbsolutePath = (f) => getAbsolutePath([AGENT_UPLOAD_PATH].concat(f));
  const zipFilesOnly = (f) => f.endsWith('zip') === true;
  const files = fs.readdirSync(AGENT_UPLOAD_PATH)
    .filter(zipFilesOnly)
    .map(extractAbsolutePath);
  
  files.forEach((f) => {
    fs.unlink(f, (err) => {
      if (!!err) {
        throw err;
      }
    });
  });
}

exports.AGENT_UPLOAD_PATH = AGENT_UPLOAD_PATH;
exports.AGENT_UNZIP_PATH = AGENT_UNZIP_PATH;