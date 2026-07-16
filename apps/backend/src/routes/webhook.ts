import { Router } from "express";
import { registerFlutterwaveWebhook } from "../services/payments/flutterwave-webhook";

const webhookRouter = Router();

registerFlutterwaveWebhook(webhookRouter, "/flutterwave");

export { webhookRouter };
