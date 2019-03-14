// Require Third-party Dependencies
require("dotenv").config();
const test = require("japa");
const got = require("got");
const is = require("@slimio/is");

// Require Internal Dependencies
const httpServer = require("../src/httpServer");

// Globals
const PORT = process.env.port || 1337;
const DEFAULT_URL = new URL(`http://localhost:${PORT}/`);

test.group("REST Tests", (group) => {
    group.before(() => {
        httpServer.listen(PORT);
    });

    test("/", async(assert) => {
        const { body } = await got(DEFAULT_URL, { json: true });

        assert.equal(is.plainObject(body), true);
        assert.equal(is.number(body.uptime), true);
        assert.deepEqual(Object.keys(body), ["uptime"]);
    });
});
