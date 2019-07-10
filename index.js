require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { readFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const { createServer } = require("https");

// Require Internal Dependencies
const httpServer = require("./src/httpServer");
const getSession = require("./src/session");
const { qWrap } = require("./src/utils");

// CONSTANTS
const SSL_DIR = join(process.cwd(), "ssl");
const PORT = process.env.api_http_port || 1337;
const ACTIVE_SSL = process.env.api_http_ssl === "true";

function httpStarted() {
    const kw = ACTIVE_SSL ? "https" : "http";
    console.log(`${kw} server started at: ${`${kw}://localhost:${PORT}`}`);
}

async function main() {
    if (ACTIVE_SSL) {
        try {
            mkdirSync(SSL_DIR);
        }
        catch (err) {
            // Skip
        }

        const options = {
            key: readFileSync(join(SSL_DIR, "key.pem")),
            cert: readFileSync(join(SSL_DIR, "cert.pem"))
        };

        createServer(options, httpServer.handler).listen(httpStarted);
    }
    else {
        httpServer.listen(PORT, httpStarted);
    }

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
