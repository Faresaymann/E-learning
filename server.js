require("dotenv/config");
const https = require("https");
const app = require("./app");

// Create a custom https agent with TLSv1_2
const agent = new https.Agent({ secureProtocol: "TLSv1_2_method" });

// CONNECT TO DATABASE
require("./config/database");

// START SERVER
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, function () {
  console.log(`[SERVER] listening on port: ${PORT}`);
});

// HANDLE UNCAUGHT EXCEPTION
process.on("uncaughtException", function (err, origin) {
  console.error(`[ERROR] error: ${err}`, origin);
  server.close(() => {
    console.log(`[SERVER] closing server`);
    process.exit(1);
  });
});

// HANDLE UNHANDLED REJECTIONS
process.on("unhandledRejection", function (reason, promise) {
  console.error(`[ERROR] reason: `, reason, " at promise: ", promise);
  server.close(() => {
    console.log(`[SERVER] closing server`);
    process.exit(1);
  });
});
