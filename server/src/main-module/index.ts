import express, { Express, Request, Response } from "express";
import { Sequelize } from "sequelize";
import PaymentModule from "../payment-module";

export default class MainModule {
  private app: Express
  constructor(port: number, sequelize: Sequelize) {
    this.app = express();
    this.app.listen(port);

    /* register others modules */
    new PaymentModule(this.app, sequelize)
  }
}