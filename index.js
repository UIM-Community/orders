// Require Third-party Dependencies
require("dotenv").config();

// Require Internal Dependencies
const httpServer = require("./src/httpServer");
const getSession = require("./src/session");
const { qWrap } = require("./src/utils");

// Globals
const PORT = process.env.port || 1337;

async function main() {
    httpServer.listen(PORT, () => console.log(`Http server now listening on port: ${PORT}`));

    const sess = await getSession();
    const tOrders = sess.getTable("cmdb_order");
    const [row = null] = await qWrap(
        tOrders.select(["number"]).orderBy("number desc").limit(1)
    );
    if (row === null) {
        throw new Error("Unable to found last number for orders!");
    }

    httpServer.use((req, res, next) => {
        req.lastId = row;
        next();
    });
}
main().catch(console.error);
