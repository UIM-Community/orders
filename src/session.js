// Require Third-party Dependencies
require("dotenv").config();

// Require Third-party Dependencies
const mysqlx = require("@mysql/xdevapi");

const DBOptions = {
    host: process.env.db_host || "localhost",
    port: 33060,
    user: process.env.db_user,
    password: process.env.db_password,
    schema: process.env.db_database
};

async function getSession() {
    const sess = await mysqlx.getSession(DBOptions);

    return sess.getSchema(DBOptions.schema);
}

module.exports = getSession;
