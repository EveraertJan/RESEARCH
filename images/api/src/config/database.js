const knex = require('knex');
const config = require('../db/knexfile').development;

let dbInstance = null;

const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = knex(config);
  }
  return dbInstance;
};

const closeDatabase = async () => {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
};

module.exports = {
  getDatabase,
  closeDatabase
};
