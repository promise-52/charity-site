import dotenv from "dotenv";
import MainModule from "./main-module";
import DatabaseModule from "./database-module";

dotenv.config();

const port = parseInt(process.env?.PORT ?? '3001');

const database = new DatabaseModule();
database.init().then(() => {
  new MainModule(port, database.sequelize)
})

