// Require Third-party Dependencies
require("dotenv").config();

// Require Internal Dependencies
const httpServer = require("./src/httpServer");

// Globals
const PORT = process.env.port || 1337;

httpServer.listen(PORT, () => console.log(`Http server now listening on port: ${PORT}`));
