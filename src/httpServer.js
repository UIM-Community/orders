require("make-promises-safe");

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const bodyParser = require("body-parser");
const { validate } = require("indicative");

// Require Internal Dependencies
const getSession = require("./session");
const { qWrap, capitalizeFirstLetter } = require("./utils");

// Create HTTP Server
const httpServer = polka();
httpServer.use(bodyParser.json());

httpServer.get("/", (req, res) => {
    send(res, 200, { uptime: process.uptime() });
});

httpServer.get("/bu/:trigram?", async(req, res) => {
    const trigram = req.params.trigram;

    const sess = await getSession();
    const tBusinessUnit = sess.getTable("cmdb_bu");
    if (typeof trigram !== "string") {
        return send(res, 200, await qWrap(tBusinessUnit.select(["name", "trigram", "status", "last_update"])));
    }

    const [row = null] = await qWrap(tBusinessUnit
        .select(["name", "trigram", "status", "id"])
        .where("trigram = :trigram")
        .bind("trigram", trigram)
    );
    if (row === null) {
        return send(res, 500, `Unable to found Business Unit with trigram '${trigram}'`);
    }

    const ret = { name: row[0], trigram: row[1], status: row[2], attributes: [] };
    await sess.getTable("cmdb_bu_attr")
        .select(["key", "value", "last_update"])
        .where("id = :id").bind("id", row[3])
        .execute((value) => ret.attributes.push(value));

    return send(res, 200, ret);
});

httpServer.get("/orders", async(req, res) => {
    const sess = await getSession();
    const tOrders = sess.getTable("cmdb_order");
    const rows = await qWrap(tOrders.select(["id", "number", "status", "last_update"]));

    return send(res, 200, rows);
});

httpServer.post("/order", async(req, res) => {
    try {
        await validate(req.body, {
            application: "required|min:3|max:3",
            "attr.title": "string|max:255",
            "attr.description": "string|max:255",
            "attr.team": "string|max:255",
            "attr.servicenow": "string|max:255",
            "attr.mail": "email",
            "attr.information": "string|max:255"
        });
    }
    catch (err) {
        console.error(err);

        return send(res, 500, err.message);
    }
    const { application, attr = Object.create(null) } = req.body;
    const attributes = Object.entries(attr);

    const sess = await getSession();
    const [row = null] = await qWrap(
        sess.getTable("cmdb_bu").select(["id"]).where("trigram = :trigram").bind("trigram", application)
    );
    if (row === null) {
        return send(res, 500, `Unable to found Business Unit with trigram '${application}'`);
    }

    const number = ++req.lastId[0];
    const ret = await sess.getTable("cmdb_order").insert(["number", "status"]).values([number, 1]).execute();
    if (ret.getAffectedItemsCount() !== 1) {
        return send(res, 500, `Failed to insert new Order number => ${number}`);
    }

    const orderId = ret.getAutoIncrementValue();
    let cursor = sess.getTable("cmdb_order_attr")
        .insert(["order_id", "bu_id", "key", "value"])
        .values([orderId, row[0], "Application", application]);

    for (const [key, value] of attributes) {
        cursor = cursor.values([orderId, row[0], capitalizeFirstLetter(key), value]);
    }
    const queryResult = await cursor.execute();

    if (queryResult.getAffectedItemsCount() !== attributes.length + 1) {
        return send(res, 500, "Unable to insert all orders attributes!");
    }

    return send(res, 200, { orderId });
});

// TODO: Decom an Order
httpServer.patch("/order", (req, res) => {
    send(res, 200, "ok");
});

httpServer.get("/order_attr/:id", async(req, res) => {
    const id = req.params.id;

    const sess = await getSession();
    const tOrdersAttr = sess.getTable("cmdb_order_attr");
    const rows = await qWrap(tOrdersAttr
        .select(["id", "bu_id", "key", "value"])
        .where("order_id = :id").bind("id", id)
    );

    return send(res, 200, rows);
});

module.exports = httpServer;
