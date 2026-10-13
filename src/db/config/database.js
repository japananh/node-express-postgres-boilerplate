const { sqlDB } = require('../../config/config');

// Exists because sequelize-cli only accepts a config path, not an object.
// It reads `username`, not `user`, and otherwise falls back to the OS user.
module.exports = { ...sqlDB, username: sqlDB.user };
