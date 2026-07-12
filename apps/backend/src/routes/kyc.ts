import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getKycByUserId,
  createKycSubmission,
  updateKycStatus,
  getKycById,
  getPendingKycSubmissions,
  getAllKycSubmissions,
  getKycStats,
  getKycAuditLogs,
  findUserById,
} from "@thrift/db";

export const kycRouter = Router();

const VALID_ID_TYPES = ["bvn", "nin", "drivers_license", "international_passport", "voter_card"];
const VALID_LEVELS = [1, 2, 3];
const LEVEL_1_ID_TYPES = ["bvn", "nin"];
const LEVEL_2_ID_TYPES = ["drivers_license", "international_passport", "voter_card"];

const ID_VALIDATORS: Record<string, { pattern?: RegExp; minLength: number; maxLength: number }> = {
  bvn: { pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
  nin: { pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
  drivers_license: { minLength: 5, maxLength: 20 },
  international_passport: { minLength: 5, maxLength: 20 },
  voter_card: { minLength: 5, maxLength: 20 },
};

function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, async () => {
    try {
      const user = await findUserById(req.user!.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ success: false, error: "Admin access required" });
        return;
      }
      next();
    } catch {
      res.status(500).json({ success: false, error: "Authorization check failed" });
    }
  });
}

function validateIdNumber(idType: string, idNumber: string): string | null {
  const validator = ID_VALIDATORS[idType];
  if (!validator) return "Invalid ID type";

  if (idNumber.length < validator.minLength || idNumber.length > validator.maxLength) {
    return `ID number must be between ${validator.minLength} and ${validator.maxLength} characters`;
  }

  if (validator.pattern && !validator.pattern.test(idNumber)) {
    return `Invalid ID number format for ${idType}`;
  }

  return null;
}

// ── User Endpoints ────────────────────────────────────

kycRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const kyc = await getKycByUserId(req.user!.userId);
    if (!kyc) {
      res.json({ success: true, data: { status: "none" } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: kyc.id,
        level: kyc.level,
        status: kyc.status,
        idType: kyc.idType,
        idNumber: kyc.idNumber,
        idDocumentUrl: kyc.idDocumentUrl,
        selfieUrl: kyc.selfieUrl,
        rejectionReason: kyc.rejectionReason,
        verifiedAt: kyc.verifiedAt,
        submittedAt: kyc.submittedAt,
        createdAt: kyc.createdAt,
        documents: kyc.documents.map((doc) => ({
          id: doc.id,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          purpose: doc.purpose,
          uploadedAt: doc.uploadedAt,
        })),
        auditLogs: kyc.auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          oldStatus: log.oldStatus,
          newStatus: log.newStatus,
          notes: log.notes,
          performedBy: log.performedBy,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("Get KYC error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch KYC status" });
  }
});

kycRouter.get("/status", authMiddleware, async (req, res) => {
  try {
    const kyc = await getKycByUserId(req.user!.userId);
    res.json({
      success: true,
      data: {
        status: kyc?.status ?? "none",
        idType: kyc?.idType ?? null,
      },
    });
  } catch (err) {
    console.error("Get KYC status error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch KYC status" });
  }
});

kycRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { level, idType, idNumber, idDocumentUrl, selfieUrl, documents } = req.body;
    const userId = req.user!.userId;

    if (!level || !VALID_LEVELS.includes(level)) {
      res.status(400).json({ success: false, error: `Invalid level. Must be one of: ${VALID_LEVELS.join(", ")}` });
      return;
    }

    if (!idType || !idNumber) {
      res.status(400).json({ success: false, error: "ID type and ID number are required" });
      return;
    }

    if (!VALID_ID_TYPES.includes(idType)) {
      res.status(400).json({
        success: false,
        error: `Invalid ID type. Must be one of: ${VALID_ID_TYPES.join(", ")}`,
      });
      return;
    }

    if (level === 1 && !LEVEL_1_ID_TYPES.includes(idType)) {
      res.status(400).json({ success: false, error: "Level 1 requires BVN or NIN" });
      return;
    }

    if (level === 2 && !LEVEL_2_ID_TYPES.includes(idType)) {
      res.status(400).json({ success: false, error: "Level 2 requires Driver's License, International Passport, or Voter's Card" });
      return;
    }

    const validationError = validateIdNumber(idType, idNumber);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }

    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        if (!doc.fileUrl || !doc.fileName) {
          res.status(400).json({ success: false, error: "Each document must have fileUrl and fileName" });
          return;
        }
        if (doc.fileSize && doc.fileSize > 5 * 1024 * 1024) {
          res.status(400).json({ success: false, error: "File size must be less than 5MB" });
          return;
        }
      }
    }

    const kyc = await createKycSubmission({
      userId,
      level,
      idType,
      idNumber,
      idDocumentUrl: idDocumentUrl || undefined,
      selfieUrl: selfieUrl || undefined,
      documents: documents || undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        id: kyc!.id,
        level: kyc!.level,
        status: kyc!.status,
        idType: kyc!.idType,
        idNumber: kyc!.idNumber,
        submittedAt: kyc!.submittedAt,
        documents: kyc!.documents,
      },
    });
  } catch (err: any) {
    console.error("Submit KYC error:", err);
    if (err.message === "KYC already submitted or verified") {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to submit KYC" });
  }
});

kycRouter.post("/documents", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { fileUrl, fileType, fileName, fileSize, purpose } = req.body;

    if (!fileUrl || !fileName) {
      res.status(400).json({ success: false, error: "fileUrl and fileName are required" });
      return;
    }

    const kyc = await getKycByUserId(userId);
    if (!kyc || kyc.status === "none") {
      res.status(400).json({ success: false, error: "Submit KYC first before adding documents" });
      return;
    }

    if (kyc.status === "verified") {
      res.status(400).json({ success: false, error: "Cannot add documents to verified KYC" });
      return;
    }

    const { addKycDocument } = await import("@thrift/db");
    const doc = await addKycDocument({
      kycId: kyc.id,
      fileUrl,
      fileType: fileType || "application/octet-stream",
      fileName,
      fileSize: fileSize || 0,
      purpose: purpose || "id_document",
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("Add KYC document error:", err);
    res.status(500).json({ success: false, error: "Failed to add document" });
  }
});

// ── Admin Endpoints ───────────────────────────────────

kycRouter.get("/admin/stats", adminMiddleware, async (req, res) => {
  try {
    const stats = await getKycStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Get KYC stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch KYC stats" });
  }
});

kycRouter.get("/admin/submissions", adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    const submissions = await getAllKycSubmissions({ limit, offset, status });
    res.json({ success: true, data: submissions });
  } catch (err) {
    console.error("Get KYC submissions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch submissions" });
  }
});

kycRouter.get("/admin/submissions/pending", adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const submissions = await getPendingKycSubmissions({ limit, offset });
    res.json({ success: true, data: submissions });
  } catch (err) {
    console.error("Get pending KYC submissions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch pending submissions" });
  }
});

kycRouter.get("/admin/:kycId", adminMiddleware, async (req, res) => {
  try {
    const kyc = await getKycById(req.params.kycId);
    if (!kyc) {
      res.status(404).json({ success: false, error: "KYC not found" });
      return;
    }
    res.json({ success: true, data: kyc });
  } catch (err) {
    console.error("Get KYC detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch KYC" });
  }
});

kycRouter.put("/admin/:kycId/approve", adminMiddleware, async (req, res) => {
  try {
    const kyc = await getKycById(req.params.kycId);
    if (!kyc) {
      res.status(404).json({ success: false, error: "KYC not found" });
      return;
    }

    if (kyc.status === "verified") {
      res.status(400).json({ success: false, error: "KYC is already verified" });
      return;
    }

    const updated = await updateKycStatus(kyc.userId, "verified", {
      performedBy: req.user!.userId,
      notes: "Approved by admin",
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Approve KYC error:", err);
    res.status(500).json({ success: false, error: "Failed to approve KYC" });
  }
});

kycRouter.put("/admin/:kycId/reject", adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, error: "Rejection reason is required" });
      return;
    }

    const kyc = await getKycById(req.params.kycId);
    if (!kyc) {
      res.status(404).json({ success: false, error: "KYC not found" });
      return;
    }

    if (kyc.status === "verified") {
      res.status(400).json({ success: false, error: "Cannot reject verified KYC" });
      return;
    }

    const updated = await updateKycStatus(kyc.userId, "rejected", {
      rejectionReason: reason,
      performedBy: req.user!.userId,
      notes: `Rejected: ${reason}`,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Reject KYC error:", err);
    res.status(500).json({ success: false, error: "Failed to reject KYC" });
  }
});

kycRouter.put("/admin/:kycId/review", adminMiddleware, async (req, res) => {
  try {
    const kyc = await getKycById(req.params.kycId);
    if (!kyc) {
      res.status(404).json({ success: false, error: "KYC not found" });
      return;
    }

    if (kyc.status !== "pending") {
      res.status(400).json({ success: false, error: "Only pending submissions can be moved to review" });
      return;
    }

    const updated = await updateKycStatus(kyc.userId, "under_review", {
      performedBy: req.user!.userId,
      notes: "Marked as under review",
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Review KYC error:", err);
    res.status(500).json({ success: false, error: "Failed to update KYC status" });
  }
});

kycRouter.get("/admin/:kycId/audit", adminMiddleware, async (req, res) => {
  try {
    const logs = await getKycAuditLogs(req.params.kycId);
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error("Get KYC audit logs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch audit logs" });
  }
});
