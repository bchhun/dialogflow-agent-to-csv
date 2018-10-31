const path = require('path');
const AGENT_UPLOAD_PATH = !!process.env.AGENT_UPLOAD_PATH ?
    process.env.AGENT_UPLOAD_PATH.split(path.sep) : ['/tmp'];
const AGENT_UNZIP_PATH = AGENT_UPLOAD_PATH.concat(['unzipped']);
const AGENT_CSV_PATH = ['./public', 'csv'];

const fs = require('fs-extra');
const util = require('util');
const rimraf = require('rimraf');
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

/**
 * @param  {string[]} pathToDelete
 * @param  {string} fileExtension
 * @param  {function} anyOtherFilter
 *
 * @return {Promise<boolean>} a promised boolean
 */
function deleteFiles(pathToDelete, fileExtension, anyOtherFilter = null) {
  const extractAbsPath = (f) => getAbsolutePath(pathToDelete.concat(f));
  const currentFileExtensionOnly = (f) => f.endsWith(fileExtension) === true;

  return new Promise((resolve, reject) => {
    fs.readdir(pathToDelete.join(path.sep)).then((files) => {
      const filesToDelete = files
          .filter(currentFileExtensionOnly)
          .filter(!!anyOtherFilter ? anyOtherFilter: () => true)
          .map(extractAbsPath)
          .map((f) => fs.unlink(f));

      Promise.all(filesToDelete)
          .then(() => resolve(true))
          .catch((error) => {
            console.debug(error);
            reject(false);
          });
    }).catch((error) => {
      console.debug(error);
      reject(false);
    });
  });
}

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

const deleteZipFiles = (anyOtherFilterFunction = null) => {
  return deleteFiles(AGENT_UPLOAD_PATH, 'zip', anyOtherFilterFunction);
};

const deleteCsvFiles = (anyOtherFilterFunction = null) => {
  return deleteFiles(AGENT_CSV_PATH, 'csv', anyOtherFilterFunction);
};

const deleteUnzippedFolders = (anyOtherFilterFunction = null) => {
  return new Promise((resolve, reject) => {
    const unzippedPathGlob = AGENT_UNZIP_PATH.concat(['*']);

    if (!!anyOtherFilterFunction) {
      fs.readdir(AGENT_UNZIP_PATH.join(path.sep)).then((folders) => {
        const extractAbsPath = (f) => {
          return getAbsolutePath(AGENT_UNZIP_PATH.concat(f));
        };

        const folderToDelete = folders
            .filter(anyOtherFilterFunction)
            .map(extractAbsPath).pop();

        try {
          rimraf(folderToDelete, function() {
            resolve(true);
          });
        } catch (error) {
          console.error(error);
          reject(false);
        }
      });
    } else {
      try {
        rimraf(unzippedPathGlob.join(path.sep), function() {
          resolve(true);
        });
      } catch (error) {
        console.error(error);
        reject(false);
      }
    }
  });
};

const deleteEverything = (anyOtherFilterFunction = null) => {
  return new Promise((resolve, reject) => {
    Promise.all([
      deleteZipFiles(anyOtherFilterFunction),
      deleteCsvFiles(anyOtherFilterFunction),
      deleteUnzippedFolders(anyOtherFilterFunction),
    ]).then(([zipFilesDeleted, csvFilesDeleted, unzippedFoldersDeleted]) => {
      resolve({
        zipFilesDeleted,
        csvFilesDeleted,
        unzippedFoldersDeleted,
      });
    }).catch((error) => {
      console.error(error);
      reject({error});
    });
  });
};

exports.deleteZipFiles = deleteZipFiles;
exports.deleteCsvFiles = deleteCsvFiles;
exports.deleteEverything = deleteEverything;
exports.AGENT_UPLOAD_PATH = AGENT_UPLOAD_PATH;
exports.AGENT_UNZIP_PATH = AGENT_UNZIP_PATH;
exports.AGENT_CSV_PATH = AGENT_CSV_PATH;
