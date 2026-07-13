import express from "express";
import cors from "cors";
import cron from "node-cron";
import path from "path";
import { healthRouter } from "./routes/health";
import { configRouter } from "./routes/config";
import { authRouter } from "./routes/auth";
import { donationsRouter } from "./routes/donations";
import { groupsRouter } from "./routes/groups";
import { referralsRouter } from "./routes/referrals";
import { kycRouter } from "./routes/kyc";
import { userRouter } from "./routes/user";
import { transactionsRouter } from "./routes/transactions";
import { clearancesRouter } from "./routes/clearances";
import { defaultsRouter } from "./routes/defaults";
import { chatRouter } from "./routes/chat";
import { whatsappRouter } from "./routes/whatsapp";
import { marketplaceRouter } from "./routes/marketplace";
import { jobsRouter } from "./routes/jobs";
import { loansRouter } from "./routes/loans";
import { circlesRouter } from "./routes/circles";
import { navigationRouter } from "./routes/navigation";
import { uploadRouter } from "./routes/upload";
import { circleInterestJob } from "./jobs/circleInterestJob";

const app = express();
const PORT = process.env.PORT || 4000;
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads';

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.resolve(LOCAL_UPLOAD_DIR), {
  maxAge: "1d",
  etag: true,
}));

app.use("/api/health", healthRouter);
app.use("/api/config", configRouter);
app.use("/api/auth", authRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/user", userRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/clearances", clearancesRouter);
app.use("/api/defaults", defaultsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/loans", loansRouter);
app.use("/api/circles", circlesRouter);
app.use("/api/navigation", navigationRouter);
app.use("/api/upload", uploadRouter);

cron.schedule("0 0 * * 0", circleInterestJob);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
