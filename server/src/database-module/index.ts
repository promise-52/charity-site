import { Sequelize, DataTypes } from 'sequelize';
import Payment from './models/Payment';

export default class DatabaseModule {
   public sequelize: Sequelize;
  constructor() {
    this.sequelize = new Sequelize('sqlite::charity:');
  }
  public async init() {
    Payment(this.sequelize);
    
    await this.sequelize.sync({ force: true });
  }
}