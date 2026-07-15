export { prisma, softDelete } from "./services/prisma";

export { getConfig, saveConfig } from "./services/config";

export { findUserByEmail, findUserById, createUser, setEmailVerified, setPhoneVerified, setTotpSecret, setTwoFactorEnabled, updatePasswordHash, setUserIdentity, setRegistrationProgress } from "./services/users";

export {
  createVerificationToken,
  findValidVerificationToken,
  consumeVerificationToken,
  deleteVerificationTokens,
} from "./services/verification-tokens";

export type { VerificationType, VerificationChannel } from "./services/verification-tokens";

export {
  createDonation,
  findDonationById,
  findDonationByReference,
  updateDonationStatus,
  getUserDonations,
  getDonationStats,
} from "./services/donations";

export { getGroups, findGroupById, createGroup, updateGroupAmount } from "./services/groups";

export {
  createTransaction,
  getUserTransactions,
  getUserTransactionsFiltered,
  fundWallet,
  findTransactionByReference,
  updateTransactionStatus,
} from "./services/transactions";

export {
  generateReferralCode,
  findUserByReferralCode,
  createReferral,
  createReferralEarning,
  getUserReferrals,
  getUserReferralEarnings,
  getTierForCount,
  getNextTier,
  getReferralStats,
} from "./services/referrals";

export {
  getKycByUserId,
  getKycById,
  createKycSubmission,
  updateKycStatus,
  getPendingKycSubmissions,
  getAllKycSubmissions,
  getKycStats,
  addKycDocument,
  getKycDocuments,
  getKycAuditLogs,
  isKycVerifiedForVirtualAccount,
} from "./services/kyc";

export { getUserProfile, updateUserProfile } from "./services/user-profile";

export { getUserGroups } from "./services/user-groups";

export { getClearancesForUser, getClearanceStats } from "./services/clearances";

export { getDefaultsForUser } from "./services/defaults";

export {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createConversation,
  getOrCreateConversation,
} from "./services/chat";

export {
  getWhatsappGroups,
  getAllWhatsappGroups,
  createWhatsappGroup,
  joinWhatsappGroup,
  toggleWhatsappGroupPin,
  seedDefaultWhatsappGroups,
} from "./services/whatsapp";

export {
  createMarketplaceListing,
  getMarketplaceListings,
  getMarketplaceListingById,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  getMarketplaceListingsBySeller,
  createMarketplaceOffer,
  updateMarketplaceOffer,
  getMarketplaceOffersByListing,
  getMarketplaceOffersForSeller,
  getMarketplaceOffererOffers,
} from "./services/marketplace";

export {
  createJobListing,
  getJobListings,
  getJobListingById,
  updateJobListing,
  deleteJobListing,
  getJobListingsByPoster,
  createJobApplication,
  updateJobApplication,
  getJobApplicationsByListing,
  getJobApplicationsByApplicant,
  getJobApplicationsForPoster,
  getJobApplicationById,
} from "./services/jobs";

export {
  createLoan,
  getLoanById,
  getLoansByBorrower,
  getAllLoans,
  updateLoan,
  calculateLoanTerms,
} from "./services/loans";

export { getWalletBalance, debitWallet, creditWallet } from "./services/wallet";

export {
  createCircle,
  getCircleById,
  getAllCircles,
  getActiveCircles,
  updateCircle,
  openCircleAccount,
  getCircleAccountById,
  getCircleAccountsByUser,
  getCircleAccountTransactions,
  getActiveCircleAccountsByUser,
  getAllActiveCircleAccounts,
  updateCircleAccount,
  earlyWithdrawCircleAccount,
  matureCircleAccount,
  getCircleAccountInterestBreakdown,
  calculateWeeklyInterestForAccount,
  runWeeklyInterestJob,
  getCirclePayoutRequests,
  getCirclePayoutRequestsByUser,
  approveCirclePayoutRequest,
  declineCirclePayoutRequest,
} from "./services/circles";

export {
  getNavigationForRole,
  getAllNavigationItems,
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  assignNavigationToRole,
  removeNavigationFromRole,
  getRoles,
} from "./services/navigation";

export {
  createVirtualAccount,
  getVirtualAccountsByUser,
  getVirtualAccountById,
  getVirtualAccountByAccountNumber,
  getVirtualAccountByReference,
  updateVirtualAccountStatus,
  updateVirtualAccountLastTransfer,
  deleteVirtualAccount,
  getUsersWithoutVirtualAccounts,
  hasVirtualAccountForProvider,
  hasVirtualAccount,
} from "./services/virtual-accounts";

export { createAuditLog, getAuditLogs } from "./services/audit";

export {
  ensureNotificationPreference,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "./services/notifications";

export type { NotificationChannel, NotificationStatus, NotificationPreferences, NotificationRecord, CreateNotificationInput, ListNotificationsOptions } from "./services/notifications";

export {
  getAdminStats,
  getUserGrowth,
  listUsers,
  getUserDetail,
  updateUserByAdmin,
  suspendUser,
  reactivateUser,
} from "./services/admin";

export {
  getAllTransactions,
  getTransactionStats,
  getAllReferralEarnings,
  payReferralEarning,
  getAllVirtualAccounts,
  getMembersWithoutVirtualAccount,
  getAllMarketplaceListingsAdmin,
  getAllJobListingsAdmin,
  getAllDonationsAdmin,
  getDonationStatsAdmin,
} from "./services/admin-oversight";
