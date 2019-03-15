// Require Third-party Dependencies
require("dotenv").config();
const test = require("japa");
const is = require("@slimio/is");
const { get, post, patch } = require("httpie");

// Require Internal Dependencies
const httpServer = require("../src/httpServer");
const getSession = require("../src/session");

// Globals
const PORT = process.env.port || 1337;
const DEFAULT_URL = new URL(`http://localhost:${PORT}/`);
const lastID = 100500;

test.group("REST Tests", (group) => {
    let orderId;
    group.before(() => {
        httpServer.listen(PORT);
        httpServer.use((req, res, next) => {
            req.lastId = [lastID];
            next();
        });
    });

    group.after(async() => {
        const sess = await getSession();
        await sess.getTable("cmdb_order")
            .delete()
            .where("number >= :number")
            .bind("number", lastID)
            .execute();
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

    test("/order - Create a new order", async(assert) => {
        const uri = new URL("order", DEFAULT_URL).href;

        const body = {
            application: "ACG",
            attr: {
                title: "Test Application",
                description: "Hello world!",
                team: "",
                servicenow: "",
                mail: "gentilhomme.thomas@gmail.com",
                information: ""
            }
        };
        const { data, statusCode } = await post(uri, { body });

        assert.equal(statusCode, 201);
        assert.equal(is.plainObject(data), true);
        assert.equal(is.number(data.orderId), true);
        assert.deepEqual(Object.keys(data), ["orderId"]);
        orderId = data.orderId;

        const { data: order } = await get(new URL(`order/${data.orderId}`, DEFAULT_URL).href);
        assert.equal(Number(order.id), Number(data.orderId));
        assert.equal(order.number, lastID + 1);
        assert.equal(order.status, 1);
    });

    test("/order - Create order (Unable to found business unit)", async(assert) => {
        const uri = new URL("order", DEFAULT_URL).href;

        const body = {
            application: "WAL",
            attr: {
                title: "Test Application",
                description: "Hello world!",
                team: "",
                servicenow: "",
                mail: "gentilhomme.thomas@gmail.com",
                information: ""
            }
        };

        try {
            await post(uri, { body });
        }
        catch (err) {
            assert.equal(err.statusCode, 500);
            assert.equal(err.data, "Unable to found Business Unit with trigram 'WAL'");
        }
    });

    test("/order - update status", async(assert) => {
        const uri = new URL(`order/${orderId}`, DEFAULT_URL).href;
        const body = { status: false };
        const { statusCode } = await patch(uri, { body });
        assert.equal(statusCode, 200);

        const { data: order } = await get(uri);
        assert.equal(order.status, 0);
    });
});
