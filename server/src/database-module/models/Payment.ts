import { Sequelize, DataTypes } from 'sequelize';

export default function (sequelize: Sequelize) {
  return sequelize.define('Payment', 
    {
      paymentId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      redirectUrl: DataTypes.STRING,
      value: DataTypes.INTEGER,
      indempotencyKey: DataTypes.UUIDV4,
      status: DataTypes.ENUM('pending', 'waiting_for_capture', 'succeeded', 'canceled'),
    },
    {
      timestamps: true
    }
  )
}