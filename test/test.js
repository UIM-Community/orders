// Require Third-party Dependencies
require("dotenv").config();
const test = require("japa");
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

    test("/order", async(assert) => {
        const { data } = await get(new URL("order", DEFAULT_URL).href);

        assert.equal(is.array(data), true);
        const [id, number, status, lastUpdate] = data.pop();
        assert.equal(is.number(id), true);
        assert.equal(is.number(number), true);
        assert.equal(is.number(status), true);
        assert.equal(is.number(lastUpdate), true);

        const { data: ret } = await get(new URL(`order/${id}`, DEFAULT_URL).href);
        assert.equal(is.plainObject(ret), true);
        assert.equal(ret.id, id);
        assert.equal(ret.number, number);
        assert.equal(ret.status, status);
        assert.equal(ret.lastUpdate, lastUpdate);
    });

    test("/order (Unable to found order with id)", async(assert) => {
        try {
            await get(new URL("order/58525500", DEFAULT_URL).href);
        }
        catch (err) {
            assert.equal(err.statusCode, 500);
            assert.equal(err.data, "Unable to found order with id 58525500");
        }
    });
});
