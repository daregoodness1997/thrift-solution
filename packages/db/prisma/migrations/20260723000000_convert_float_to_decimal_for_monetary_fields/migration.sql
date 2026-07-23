-- AlterTable: Convert monetary FLOAT (DOUBLE PRECISION) to DECIMAL (NUMERIC) for exact arithmetic

-- Group
ALTER TABLE "groups" ALTER COLUMN "target_amount" SET DATA TYPE NUMERIC(19,4) USING "target_amount"::NUMERIC(19,4);
ALTER TABLE "groups" ALTER COLUMN "current_amount" SET DATA TYPE NUMERIC(19,4) USING "current_amount"::NUMERIC(19,4);

-- Donation
ALTER TABLE "donations" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);

-- Transaction
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);

-- ReferralEarning
ALTER TABLE "referral_earnings" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);

-- MarketplaceListing
ALTER TABLE "marketplace_listings" ALTER COLUMN "price" SET DATA TYPE NUMERIC(19,4) USING "price"::NUMERIC(19,4);

-- MarketplaceOffer
ALTER TABLE "marketplace_offers" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);

-- JobListing
ALTER TABLE "job_listings" ALTER COLUMN "salary_min" SET DATA TYPE NUMERIC(19,4) USING "salary_min"::NUMERIC(19,4);
ALTER TABLE "job_listings" ALTER COLUMN "salary_max" SET DATA TYPE NUMERIC(19,4) USING "salary_max"::NUMERIC(19,4);

-- Loan
ALTER TABLE "loans" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "interest_rate" SET DATA TYPE NUMERIC(19,4) USING "interest_rate"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "monthly_payment" SET DATA TYPE NUMERIC(19,4) USING "monthly_payment"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "total_repayment" SET DATA TYPE NUMERIC(19,4) USING "total_repayment"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "disbursed_amount" SET DATA TYPE NUMERIC(19,4) USING "disbursed_amount"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "paid_amount" SET DATA TYPE NUMERIC(19,4) USING "paid_amount"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "principal_paid" SET DATA TYPE NUMERIC(19,4) USING "principal_paid"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "interest_paid" SET DATA TYPE NUMERIC(19,4) USING "interest_paid"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "outstanding_balance" SET DATA TYPE NUMERIC(19,4) USING "outstanding_balance"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "processing_fee_value" SET DATA TYPE NUMERIC(19,4) USING "processing_fee_value"::NUMERIC(19,4);
ALTER TABLE "loans" ALTER COLUMN "processing_fee" SET DATA TYPE NUMERIC(19,4) USING "processing_fee"::NUMERIC(19,4);

-- LoanScheduleItem
ALTER TABLE "loan_schedule_items" ALTER COLUMN "principal" SET DATA TYPE NUMERIC(19,4) USING "principal"::NUMERIC(19,4);
ALTER TABLE "loan_schedule_items" ALTER COLUMN "interest" SET DATA TYPE NUMERIC(19,4) USING "interest"::NUMERIC(19,4);
ALTER TABLE "loan_schedule_items" ALTER COLUMN "total_due" SET DATA TYPE NUMERIC(19,4) USING "total_due"::NUMERIC(19,4);
ALTER TABLE "loan_schedule_items" ALTER COLUMN "principal_paid" SET DATA TYPE NUMERIC(19,4) USING "principal_paid"::NUMERIC(19,4);
ALTER TABLE "loan_schedule_items" ALTER COLUMN "interest_paid" SET DATA TYPE NUMERIC(19,4) USING "interest_paid"::NUMERIC(19,4);

-- LoanRepayment
ALTER TABLE "loan_repayments" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);
ALTER TABLE "loan_repayments" ALTER COLUMN "principal" SET DATA TYPE NUMERIC(19,4) USING "principal"::NUMERIC(19,4);
ALTER TABLE "loan_repayments" ALTER COLUMN "interest" SET DATA TYPE NUMERIC(19,4) USING "interest"::NUMERIC(19,4);

-- Circle
ALTER TABLE "circles" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);
ALTER TABLE "circles" ALTER COLUMN "weekly_amount" SET DATA TYPE NUMERIC(19,4) USING "weekly_amount"::NUMERIC(19,4);
ALTER TABLE "circles" ALTER COLUMN "interest_rate_annual" SET DATA TYPE NUMERIC(19,4) USING "interest_rate_annual"::NUMERIC(19,4);
ALTER TABLE "circles" ALTER COLUMN "processing_fee_value" SET DATA TYPE NUMERIC(19,4) USING "processing_fee_value"::NUMERIC(19,4);
ALTER TABLE "circles" ALTER COLUMN "default_penalty_value" SET DATA TYPE NUMERIC(19,4) USING "default_penalty_value"::NUMERIC(19,4);

-- CircleAddon
ALTER TABLE "circle_addons" ALTER COLUMN "estimated_cost" SET DATA TYPE NUMERIC(19,4) USING "estimated_cost"::NUMERIC(19,4);

-- CircleAccount
ALTER TABLE "circle_accounts" ALTER COLUMN "principal_amount" SET DATA TYPE NUMERIC(19,4) USING "principal_amount"::NUMERIC(19,4);
ALTER TABLE "circle_accounts" ALTER COLUMN "interest_earned" SET DATA TYPE NUMERIC(19,4) USING "interest_earned"::NUMERIC(19,4);
ALTER TABLE "circle_accounts" ALTER COLUMN "total_withdrawn" SET DATA TYPE NUMERIC(19,4) USING "total_withdrawn"::NUMERIC(19,4);
ALTER TABLE "circle_accounts" ALTER COLUMN "processing_fee" SET DATA TYPE NUMERIC(19,4) USING "processing_fee"::NUMERIC(19,4);

-- CircleContribution
ALTER TABLE "circle_contributions" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);

-- CircleDefault
ALTER TABLE "circle_defaults" ALTER COLUMN "amount_due" SET DATA TYPE NUMERIC(19,4) USING "amount_due"::NUMERIC(19,4);
ALTER TABLE "circle_defaults" ALTER COLUMN "clearance_amount" SET DATA TYPE NUMERIC(19,4) USING "clearance_amount"::NUMERIC(19,4);

-- CircleInterestLog
ALTER TABLE "circle_interest_logs" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);
ALTER TABLE "circle_interest_logs" ALTER COLUMN "principal_at_calculation" SET DATA TYPE NUMERIC(19,4) USING "principal_at_calculation"::NUMERIC(19,4);
ALTER TABLE "circle_interest_logs" ALTER COLUMN "annual_rate" SET DATA TYPE NUMERIC(19,4) USING "annual_rate"::NUMERIC(19,4);

-- CirclePayoutRequest
ALTER TABLE "circle_payout_requests" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(19,4) USING "amount"::NUMERIC(19,4);
