// Require Third-party Dependencies
require("dotenv").config();
const test = require("japa");
const got = require("got");
const is = require("@slimio/is");
const { get } = require("httpie");

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
        const { data } = await get(DEFAULT_URL.href);

        assert.equal(is.plainObject(data), true);
        assert.equal(is.number(data.uptime), true);
        assert.deepEqual(Object.keys(data), ["uptime"]);
    });

    test("/bu", async(assert) => {
        const { data: body, statusCode } = await get(new URL("bu", DEFAULT_URL).href);

        assert.equal(statusCode, 200);
        assert.equal(is.array(body), true);
        const [name, trigram, status, update] = body.pop();
        assert.equal(is.string(name), true);
        assert.equal(is.string(trigram), true);
        assert.equal(trigram.length, 3);
        assert.equal(is.number(status), true);
        assert.equal(is.number(update), true);

        const { data: ret } = await get(new URL(`bu/${trigram}`, DEFAULT_URL).href);
        assert.equal(ret.name, name);
        assert.equal(ret.trigram, trigram);
        assert.equal(ret.status, status);
        assert.equal(is.array(ret.attributes), true);
    });

    test("/bu (Unable to found business Unit)", async(assert) => {
        try {
            await get(new URL("bu/WAL", DEFAULT_URL).href);
        }
        catch (err) {
            assert.equal(err.statusCode, 500);
            assert.equal(err.data, "Unable to found Business Unit with trigram 'WAL'");
        }
    });
});
