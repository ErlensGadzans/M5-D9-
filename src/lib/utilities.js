const { writeJson, readJson } = require("fs-extra"); //TAAKES ASYNC READ/WRITE FILE FUNCTIONS FROM FS-EXTRA PACKAGE

const readDB = async (filepath) => {
  try {
    const fileAsJson = await readJson(filepath);
    return fileAsJson;
  } catch (error) {
    throw new Error(error);
  }
};

const writeDB = async (filepath, data) => {
  try {
    await writeJson(filepath, data);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  readDB,
  writeDB,
};
