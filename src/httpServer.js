require("make-promises-safe");

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");

// Require Internal Dependencies
const getSession = require("./session");
const { qWrap } = require("./utils");

// Create HTTP Server
const httpServer = polka();

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
