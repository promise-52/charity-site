import express, { Express, Request, Response } from "express";
import { ICreatePayment, PaymentStatuses, YooCheckout } from '@a2seven/yoo-checkout'; 
import { Sequelize } from "sequelize";

export default class PaymentModule {
  private checkout: YooCheckout;
  private endpoint = 'payment';

  constructor(private app: Express, private sequelize: Sequelize) {
    this.checkout = new YooCheckout({
      shopId: process.env.SHOP_ID!,
      secretKey: process.env.SECRET_KEY!
    });

    this.app.post(`${this.endpoint}/`, this.createPayment);
    this.app.get(`${this.endpoint}/`, this.checkPayment);
  }

  private async createPayment(req: Request, res: Response) {
    const indempotencyKey = req.headers['indempotency-key'];
    if (!indempotencyKey || Array.isArray(indempotencyKey)) {
      return res.status(400).json({status: 400, message: "Неверный ключ индемпотентности"});
    }

    const existedPayment = await this.getPayment(indempotencyKey);
    if (existedPayment) {
      if (existedPayment.status === PaymentStatuses.pending && existedPayment.confirmation.confirmation_url) {
        return res.redirect(existedPayment.confirmation.confirmation_url);
      }
      return res.status(200).json({ status: existedPayment.status })
    }

    const value = req.body.amount;
    if (!isNaN(parseFloat(value))) {
      return res.status(400).json({status: 400, message: "Неверная сумма"});
    }

    const createPayload: ICreatePayment = {
      amount: { value, currency: 'RUB' },
      description: '', //TODO
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: `http://localhost:3000/?token=${indempotencyKey}` //TODO
      }
    };
    
    try {
      const payment = await this.checkout.createPayment(createPayload, indempotencyKey);
      const redirectUrl = payment.confirmation.confirmation_url;
      if (redirectUrl) {
        await this.sequelize.models.Payment.create({
          status: payment.status,
          paymentId: payment.id,
          indempotencyKey,
          value,
        })
        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async getPayment(indempotencyKey: string) {
    const existedPayment = await this.sequelize.models.Payment.findOne({
      where: { indempotencyKey }
    });
    if (existedPayment) {
      return await this.checkout.getPayment(
        existedPayment.get('paymentId') as string
      );
    }
  }


  private async checkPayment(req: Request, res: Response) {
    const indempotencyKey = req.query?.token?.toString();
    if (!indempotencyKey) {
      return res.status(400).json({ status: 400, message: "Неверные параметры запроса" });
    }
    const payment = await this.getPayment(indempotencyKey)
    return payment
      ? res.status(200).write({ status: payment.status })
      : res.status(404).json({ status: 404, messsage: 'Платёж не найден' });
  }
}