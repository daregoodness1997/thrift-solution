-- CreateTable
CREATE TABLE "job_listings" (
    "id" TEXT NOT NULL,
    "poster_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "salary_min" DOUBLE PRECISION,
    "salary_max" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "resume_url" TEXT,
    "cover_letter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "term_months" INTEGER NOT NULL,
    "monthly_payment" DOUBLE PRECISION NOT NULL,
    "total_repayment" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "disbursed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_listings_poster_id_idx" ON "job_listings"("poster_id");

-- CreateIndex
CREATE INDEX "job_listings_status_idx" ON "job_listings"("status");

-- CreateIndex
CREATE INDEX "job_listings_category_idx" ON "job_listings"("category");

-- CreateIndex
CREATE INDEX "job_listings_job_type_idx" ON "job_listings"("job_type");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_listing_id_applicant_id_key" ON "job_applications"("listing_id", "applicant_id");

-- CreateIndex
CREATE INDEX "job_applications_listing_id_idx" ON "job_applications"("listing_id");

-- CreateIndex
CREATE INDEX "job_applications_applicant_id_idx" ON "job_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "loans_borrower_id_idx" ON "loans"("borrower_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- AddForeignKey
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "job_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
