require("make-promises-safe");

// Require Node.js Dependencies
const { readFileSync, readFile, access } = require("fs");
const { promisify } = require("util");
const { join } = require("path");

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const bodyParser = require("body-parser");
const sirv = require("sirv");
const compress = require("compression")();
const { validate } = require("indicative");

// Require Internal Dependencies
const getSession = require("./session");
const { qWrap, capitalizeFirstLetter } = require("./utils");
const rule = require("./rule.json");

// CONSTANTS
const VIEW_DIR = join(__dirname, "..", "views");
const DEFAULT_ORDER_ATTR = {
    Description: "",
    Servicenow: "",
    Team: "",
    Information: ""
};

// Globals
const readAsync = promisify(readFile);
const accessAsync = promisify(access);
const HTMLMainPage = readFileSync(join(VIEW_DIR, "index.html"), { encoding: "utf8" });

// Create HTTP Server
const assets = sirv("public", {
    dev: true
});
const httpServer = polka({
    onError(err, req, res) {
        return send(res, 500, err.message);
    }
});
httpServer.use(compress, assets);
httpServer.use(bodyParser.json());

httpServer.get("/view", async(req, res) => {
    send(res, 200, HTMLMainPage, { "Content-Type": "text/html" });
});

httpServer.get("/view/:name", async(req, res) => {
    const { name } = req.params;
    if (!/^[a-zA-Z_]+$/.test(name)) {
        return send(res, 500, "Invalid template name");
    }

    try {
        const view = await readAsync(join(VIEW_DIR, "modules", `${name}.html`));

        return send(res, 200, view, { "Content-Type": "text/html" });
    }
    catch (err) {
        return send(res, 500, err.message);
    }
});

httpServer.get("/template/:name/:template", async(req, res) => {
    const { name, template } = req.params;
    try {
        const templatePath = join(VIEW_DIR, "template", name, `${template}.html`);
        await accessAsync(templatePath);
        const view = await readAsync(templatePath);

        return send(res, 200, view, { "Content-Type": "text/html" });
    }
    catch (err) {
        return send(res, 500, err.message);
    }
});

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
        .where("bu_id = :id").bind("id", row[3])
        .execute((value) => ret.attributes.push(value));

    return send(res, 200, ret);
});

httpServer.get("/order/:id?", async(req, res) => {
    const id = req.params.id;

    const sess = await getSession();
    const tOrders = sess.getTable("cmdb_order_list");
    const fields = ["id", "number", "status", "last_update", "trigram", "name", "title"];

    if (typeof id === "string") {
        const [row = null] = await qWrap(
            tOrders.select(fields).where("number = :id").bind("id", id)
        );
        if (row === null) {
            return send(res, 500, `Unable to found order with id ${id}`);
        }

        return send(res, 200, {
            id: row[0], number: row[1], status: row[2], lastUpdate: row[3]
        });
    }

    return send(res, 200, await qWrap(tOrders.select(fields)));
});

httpServer.post("/order", async(req, res) => {
    try {
        await validate(req.body, rule.order);
    }
    catch (err) {
        return send(res, 400, err[0].message);
    }
    const { application, attr } = req.body;
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
        return send(res, 400, "status must be a boolean");
    }

    const sess = await getSession();
    const ret = await sess.getTable("cmdb_order")
        .update()
        .set("status", Number(status))
        .where("number = :id")
        .bind("id", orderId)
        .execute();

    if (ret.getAffectedRowsCount() !== 1) {
        return send(res, 500, `Unable to update status to ${status} for order id ${orderId}`);
    }

    return send(res, 200);
});

httpServer.get("/order/:id/attr", async(req, res) => {
    const id = req.params.id;

    try {
        const sess = await getSession();
        const tOrdersAttr = sess.getTable("cmdb_order_attr");
        const rows = await qWrap(tOrdersAttr
            .select(["key", "value"])
            .where("order_id = :id").bind("id", id)
        );

        const result = rows.reduce((prev, curr) => {
            prev[curr[0]] = curr[1];

            return prev;
        }, {});

        return send(res, 200, Object.assign({}, DEFAULT_ORDER_ATTR, result));
    }
    catch (err) {
        return send(res, 500, err.message);
    }
});

httpServer.patch("/order/:id/attr", async(req, res) => {
    try {
        await validate(req.body, {
            key: "required|string",
            value: "required|string|max:255"
        });
    }
    catch (err) {
        return send(res, 400, err[0].message);
    }
    const orderId = req.params.id;
    const { key, value } = req.body;

    const sess = await getSession();
    if (key === "Mail") {
        try {
            await validate(req.body, { value: "email" });
        }
        catch (err) {
            return send(res, 400, err[0].message);
        }
    }
    else if (key === "Application") {
        const [row = null] = await qWrap(
            sess.getTable("cmdb_bu").select(["id"])
                .where("trigram = :trigram")
                .bind("trigram", value)
        );
        if (row === null) {
            return send(res, 500, `Unable to found Business Unit with trigram '${value}'`);
        }
    }

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

httpServer.get("/order/:orderId/condition", async(req, res) => {
    const orderId = req.params.orderId;

    const sess = await getSession();
    const rows = await qWrap(sess.getTable("cmdb_order_action_list")
        .select(["id", "bu_id", "trigram", "condition", "token", "time_shift", "json"])
        .where("order_id = :id")
        .bind("id", orderId)
    );

    // eslint-disable-next-line
    const filtered = rows.map(([id, bu_id, trigram, condition, token, time_shift, json]) => {
        return { id, bu_id, trigram, condition, token, time_shift, json };
    });

    send(res, 200, filtered);
});

httpServer.post("/order/:orderId/condition", async(req, res) => {
    try {
        await validate(req.body, rule.condition);
    }
    catch (err) {
        return send(res, 400, err[0].message);
    }
    const orderId = req.params.orderId;
    const { buTrigram, token, timeShift } = req.body;

    const sess = await getSession();
    const [condition = null] = await qWrap(
        sess.getTable("cmdb_order_action_list")
            .select(["condition"])
            .where("order_id = :id")
            .bind("id", orderId)
            .orderBy("condition desc")
            .limit(1)
    );
    const conditionNumber = condition === null ? 0 : condition[0] + 1;

    const [row = null] = await qWrap(
        sess.getTable("cmdb_bu").select(["id"]).where("trigram = :trigram").bind("trigram", buTrigram)
    );
    if (row === null) {
        return send(res, 500, `Unable to found Business Unit with trigram '${buTrigram}'`);
    }

    const qRet = await sess.getTable("cmdb_order_action")
        .insert(["order_id", "bu_id", "condition", "token", "time_shift", "json"])
        .values([orderId, row[0], conditionNumber, token, timeShift, "[]"])
        .execute();

    if (qRet.getAffectedItemsCount() !== 1) {
        return send(res, 500, "Unable to insert new condition");
    }

    return send(res, 201, null);
});

httpServer.patch("/order/:id/condition", async(req, res) => {
    try {
        await validate(req.body, rule.condition);
    }
    catch (err) {
        return send(res, 400, err[0].message);
    }

    const { buTrigram, token, timeShift } = req.body;
    const id = req.params.id;
    if (isNaN(Number(id))) {
        return send(res, 400, "id must be a number");
    }

    const sess = await getSession();
    const [row = null] = await qWrap(
        sess.getTable("cmdb_bu").select(["id"]).where("trigram = :trigram").bind("trigram", buTrigram)
    );
    if (row === null) {
        return send(res, 500, `Unable to found Business Unit with trigram '${buTrigram}'`);
    }

    const qRet = await sess.getTable("cmdb_order_action")
        .update()
        .set("bu_id", row[0])
        .set("token", token)
        .set("time_shift", timeShift)
        .where("id = :id")
        .bind("id", id)
        .execute();

    if (qRet.getAffectedItemsCount() !== 1) {
        return send(res, 500, `Unable to update condition with id ${id}`);
    }

    return send(res, 200, null);
});

httpServer.delete("/order/:id/condition", async(req, res) => {
    const id = req.params.id;
    if (isNaN(Number(id))) {
        return send(res, 400, "id must be a number");
    }

    const sess = await getSession();
    const qRet = await sess.getTable("cmdb_order_action")
        .delete()
        .where("id = :id")
        .bind("id", id)
        .execute();

    if (qRet.getAffectedItemsCount() !== 1) {
        return send(res, 500, `Unable to delete condition with id ${id}`);
    }

    return send(res, 200, null);
});

module.exports = httpServer;
