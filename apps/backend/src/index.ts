import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import path from "path";
import { Router } from "express";
import { healthRouter } from "./routes/health";
import { configRouter } from "./routes/config";
import { authRouter } from "./routes/auth";
import { registrationRouter } from "./routes/registration";
import { donationsRouter } from "./routes/donations";
import { groupsRouter } from "./routes/groups";
import { referralsRouter } from "./routes/referrals";
import { kycRouter } from "./routes/kyc";
import { userRouter } from "./routes/user";
import { walletRouter } from "./routes/wallet";
import { transactionsRouter } from "./routes/transactions";
import { clearancesRouter } from "./routes/clearances";
import { defaultsRouter } from "./routes/defaults";
import { whatsappRouter } from "./routes/whatsapp";
import { marketplaceRouter } from "./routes/marketplace";
import { jobsRouter } from "./routes/jobs";
import { loansRouter } from "./routes/loans";
import { circlesRouter } from "./routes/circles";
import { navigationRouter } from "./routes/navigation";
import { uploadRouter } from "./routes/upload";
import { virtualAccountsRouter } from "./routes/virtual-accounts";
import { notificationsRouter } from "./routes/notifications";
import { adminRouter } from "./routes/admin";
import { webhookRouter } from "./routes/webhook";
import { supportRouter } from "./routes/support";
import { circleInterestJob } from "./jobs/circleInterestJob";
import { circleContributionJob } from "./jobs/circleContributionJob";
import { virtualAccountGenerationJob } from "./jobs/virtualAccountJob";
import { paymentReversalReconciliationJob } from "./jobs/paymentReversalJob";

const app = express();
const PORT = process.env.PORT || 4000;
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || "./uploads";

app.use(cors());
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

app.use(
  "/uploads",
  express.static(path.resolve(LOCAL_UPLOAD_DIR), {
    maxAge: "1d",
    etag: true,
  }),
);

app.use("/api/health", healthRouter);
app.use("/api/config", configRouter);
app.use("/api/auth", authRouter);
app.use("/api/registration", registrationRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/user", userRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/virtual-accounts", virtualAccountsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/clearances", clearancesRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/loans", loansRouter);
app.use("/api/circles", circlesRouter);
app.use("/api/navigation", navigationRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/support", supportRouter);
app.use("/api/webhooks", webhookRouter);

cron.schedule("0 0 * * 0", circleInterestJob);
cron.schedule("0 1 * * 0", circleContributionJob);
cron.schedule("0 2 * * *", virtualAccountGenerationJob);
cron.schedule("0 3 * * *", paymentReversalReconciliationJob);

import { seedNavigation } from "./seed-navigation-run";

seedNavigation().catch((err) => console.error("Navigation seed failed:", err));

app.listen(PORT, () => {
  console.log(`Backend server running on ${PORT}`);
});
