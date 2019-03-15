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
const httpServer = polka({
    onError(err, req, res) {
        // Transform Unhandled Error(s) here
        send(res, 500, err.message);
    }
});
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

httpServer.get("/order", async(req, res) => {
    const sess = await getSession();
    const tOrders = sess.getTable("cmdb_order");
    const rows = await qWrap(tOrders.select(["id", "number", "status", "last_update"]));

    return send(res, 200, rows);
});

httpServer.post("/order", async(req, res) => {
    try {
        await validate(req.body, {
            application: "required|min:3|max:3",
            "attr.title": "required|string|max:255",
            "attr.description": "required|string|max:255",
            "attr.team": "required|string|max:255",
            "attr.servicenow": "required|string|max:255",
            "attr.mail": "required|email",
            "attr.information": "required|string|max:255"
        });
    }
    catch (err) {
        console.error(err);

        return send(res, 400, err.message);
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
        .insert(["order_id", "key", "value"])
        .values([orderId, "Application", application]);

    for (const [key, value] of attributes) {
        cursor = cursor.values([orderId, capitalizeFirstLetter(key), value]);
    }
    const queryResult = await cursor.execute();

    if (queryResult.getAffectedItemsCount() !== attributes.length + 1) {
        return send(res, 500, "Unable to insert all orders attributes!");
    }

    return send(res, 201, { orderId });
});

httpServer.patch("/order/:id", async(req, res) => {
    const orderId = req.params.id;
    const status = req.body.status;
    if (typeof status !== "boolean") {
        return send(res, 400, "body.status must be a boolean");
    }

    const sess = await getSession();
    const ret = await sess.getTable("cmdb_order")
        .update()
        .set("status", Number(status))
        .where("id = :id")
        .bind("id", orderId)
        .execute();

    if (ret.getAffectedRowsCount() !== 1) {
        return send(res, 500, `Unable to update status to ${status} for order id ${orderId}`);
    }

    return send(res, 200);
});

httpServer.get("/order/:id/attr", async(req, res) => {
    const id = req.params.id;

    const sess = await getSession();
    const tOrdersAttr = sess.getTable("cmdb_order_attr");
    const rows = await qWrap(tOrdersAttr
        .select(["id", "bu_id", "key", "value"])
        .where("order_id = :id").bind("id", id)
    );

    const result = {
        bu_id: rows[0][1],
        attributes: {}
    };
    for (const row of rows) {
        result.attributes[row[2]] = {
            id: row[0],
            value: row[3]
        };
    }

    return send(res, 200, result);
});

// TODO: Implement rfc6902 (JSON Patch)
httpServer.patch("/order/:id/attr", async(req, res) => {
    try {
        await validate(req.body, {
            key: "required|string",
            value: "required|string|max:255"
        });
    }
    catch (err) {
        console.error(err);

        return send(res, 400, err.message);
    }
    const orderId = req.params.id;
    const { key, value } = req.body;

    // TODO: Depending on key value, run validation
    // Mail => email, Application => valid trigram

    const sess = await getSession();
    const ret = await sess.getTable("cmdb_order_attr")
        .update()
        .set("value", value)
        .where("order_id = :id AND key = :key")
        .bind("id", orderId)
        .bind("key", key)
        .execute();
    if (ret.getAffectedRowsCount() !== 1) {
        return send(res, 500, `Unable to update attributes for order id ${orderId}`);
    }

    return send(res, 200);
});

httpServer.get("/order/:id/action", async(req, res) => {
    const orderId = req.params.id;

    const sess = await getSession();
    const rows = await qWrap(sess.getTable("cmdb_order_action")
        .select(["id", "bu_id", "condition", "json"])
        .where("order_id = :id")
        .bind("id", orderId)
    );

    const filtered = rows.map((row) => {
        return {
            id: row[0],
            bu_id: row[1],
            condition: row[2],
            actions: row[3]
        };
    });

    send(res, 200, filtered);
});

httpServer.put("/order/:id/action", async(req, res) => {
    try {
        await validate(req.body, {
            bu_id: "required|number",
            condition: "required|number",
            json: "required|string"
        });
    }
    catch (err) {
        console.error(err);

        return send(res, 400, err.message);
    }

    const orderId = req.params.id;
});

module.exports = httpServer;
