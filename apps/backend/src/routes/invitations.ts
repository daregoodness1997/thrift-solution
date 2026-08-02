import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  findInvitationByToken,
  markInvitationAccepted,
  createUser,
  createRefreshToken,
  createAuditLog,
  decryptField,
  prisma,
} from "@thrift/db";
import { signToken, signRefreshToken } from "../middleware/auth";
import { runAutomatedKyc } from "../services/kyc-automation";

export const invitationsRouter = Router();

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

invitationsRouter.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ success: false, error: "Token is required" });
      return;
    }

    const invitation = await findInvitationByToken(token);
    if (!invitation) {
      res.status(404).json({ success: false, error: "Invalid invitation link" });
      return;
    }

    if (invitation.acceptedAt) {
      res.status(400).json({ success: false, error: "This invitation has already been accepted" });
      return;
    }

    if (invitation.revokedAt) {
      res.status(400).json({ success: false, error: "This invitation has been revoked" });
      return;
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      res.status(400).json({ success: false, error: "This invitation has expired" });
      return;
    }

    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        name: invitation.name || null,
        inviterName: invitation.invitedBy?.name || null,
        registrationFeePaid: invitation.registrationFeePaid,
        adminInitiated: invitation.adminInitiated,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    console.error("Validate invitation error:", err);
    res.status(500).json({ success: false, error: "Failed to validate invitation" });
  }
});

invitationsRouter.post("/accept", async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !name || !password) {
      res.status(400).json({ success: false, error: "Token, name, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      return;
    }

    const invitation = await findInvitationByToken(token);
    if (!invitation) {
      res.status(404).json({ success: false, error: "Invalid invitation link" });
      return;
    }

    if (invitation.acceptedAt) {
      res.status(400).json({ success: false, error: "This invitation has already been accepted" });
      return;
    }

    if (invitation.revokedAt) {
      res.status(400).json({ success: false, error: "This invitation has been revoked" });
      return;
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      res.status(400).json({ success: false, error: "This invitation has expired" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (existingUser) {
      res.status(409).json({ success: false, error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email: invitation.email,
      name,
      passwordHash,
    });

    const isStaff =
      invitation.role === "admin" ||
      invitation.role === "superadmin" ||
      invitation.role === "support" ||
      invitation.role === "moderator" ||
      invitation.role === "finance";

    const registrationFeePaid = isStaff ? true : invitation.registrationFeePaid;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: invitation.role,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        email2faEnabled: true,
        twoFactorEnabled: true,
        registrationStep: isStaff ? 4 : (registrationFeePaid ? 3 : 1),
        registrationFeePaid,
        registrationCompletedAt: isStaff ? new Date() : (registrationFeePaid ? new Date() : null),
      },
    });

    let kycResult: { kycId: string; status: string; creditScore?: number; verifiedName?: string; virtualAccount?: { accountNumber: string; bankName: string } } | null = null;

    if (!isStaff && invitation.bvn && invitation.nin) {
      try {
        const decryptedBvn = decryptField(invitation.bvn);
        const decryptedNin = decryptField(invitation.nin);

        if (decryptedBvn && decryptedNin) {
          kycResult = await runAutomatedKyc({
            userId: user.id,
            bvn: decryptedBvn,
            nin: decryptedNin,
          });
        }
      } catch (kycErr) {
        console.error(`[invitation] KYC failed for invitation ${invitation.id}:`, kycErr);
      }
    }

    await markInvitationAccepted(invitation.id);

    const accessToken = signToken({ userId: user.id, email: user.email, role: invitation.role });
    const refreshToken = signRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    await createRefreshToken(user.id, refreshToken, expiresAt);

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      ipAddress: req.ip || null,
      action: "invitation.accept",
      entity: "invitation",
      entityId: invitation.id,
      metadata: {
        role: invitation.role,
        invitedById: invitation.invitedById,
        adminInitiated: invitation.adminInitiated,
        registrationFeePaid,
        hasBvn: Boolean(invitation.bvn),
        hasNin: Boolean(invitation.nin),
        kycVerified: kycResult?.status === "verified",
        creditScore: kycResult?.creditScore || null,
        virtualAccountCreated: Boolean(kycResult?.virtualAccount),
      },
    });

    const userUpdate: Record<string, unknown> = {};
    if (kycResult?.creditScore && kycResult.creditScore >= 600) {
      userUpdate.accountTier = "silver";
    }
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data: userUpdate });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accountNumber: user.accountNumber,
          accountTier: userUpdate.accountTier || user.accountTier,
          role: invitation.role,
          emailVerified: true,
          phoneVerified: false,
          twoFactorEnabled: true,
          email2faEnabled: true,
          registrationFeePaid,
        },
        kyc: kycResult ? {
          status: kycResult.status,
          creditScore: kycResult.creditScore,
          verifiedName: kycResult.verifiedName,
        } : null,
        virtualAccount: kycResult?.virtualAccount || null,
        token: accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Accept invitation error:", err);
    res.status(500).json({ success: false, error: "Failed to accept invitation" });
  }
});
