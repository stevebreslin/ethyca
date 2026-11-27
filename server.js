const jsonServer = require("json-server");
const path = require("node:path");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));

server.use(jsonServer.defaults());
server.use(jsonServer.bodyParser);
server.use(router);

const port = Number(process.env.PORT) || 3001;
server.listen(port, "0.0.0.0", () => {
  console.log(`Privacy request API listening on port ${port}`);
});
