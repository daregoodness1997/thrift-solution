import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createJobListing,
  getJobListings,
  getJobListingById,
  updateJobListing,
  deleteJobListing,
  getJobListingsByPoster,
  createJobApplication,
  updateJobApplication,
  getJobApplicationsForPoster,
  getJobApplicationsByApplicant,
  getJobApplicationById,
} from "@thrift/db";

export const jobsRouter = Router();

jobsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = req.query.category as string | undefined;
    const jobType = req.query.jobType as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getJobListings({ page, limit, category, jobType, search });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get job listings error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch job listings" });
  }
});

jobsRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const listings = await getJobListingsByPoster(req.user!.userId);
    res.json({ success: true, data: listings });
  } catch (err) {
    console.error("Get my jobs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your job listings" });
  }
});

jobsRouter.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    const applications = await getJobApplicationsByApplicant(req.user!.userId);
    res.json({ success: true, data: applications });
  } catch (err) {
    console.error("Get my applications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your applications" });
  }
});

jobsRouter.get("/received-applications", authMiddleware, async (req, res) => {
  try {
    const applications = await getJobApplicationsForPoster(req.user!.userId);
    res.json({ success: true, data: applications });
  } catch (err) {
    console.error("Get received applications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch received applications" });
  }
});

jobsRouter.get("/applications/:applicationId", authMiddleware, async (req, res) => {
  try {
    const application = await getJobApplicationById(req.params.applicationId);
    if (!application) {
      res.status(404).json({ success: false, error: "Application not found" });
      return;
    }

    const userId = req.user!.userId;
    const isApplicant = application.applicantId === userId;
    const isPoster = application.listing.poster.id === userId;
    if (!isApplicant && !isPoster) {
      res.status(403).json({ success: false, error: "Not authorized to view this application" });
      return;
    }

    res.json({ success: true, data: application });
  } catch (err) {
    console.error("Get application detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch application" });
  }
});

jobsRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, company, location, jobType, salaryMin, salaryMax, currency, category } = req.body;

    if (!title || !description || !location || !jobType || !category) {
      res.status(400).json({ success: false, error: "Title, description, location, job type, and category are required" });
      return;
    }

    const listing = await createJobListing({
      posterId: req.user!.userId,
      title,
      description,
      company,
      location,
      jobType,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      currency: currency || "NGN",
      category,
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    console.error("Create job listing error:", err);
    res.status(500).json({ success: false, error: "Failed to create job listing" });
  }
});

jobsRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const listing = await getJobListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Job listing not found" });
      return;
    }
    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Get job listing error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch job listing" });
  }
});

jobsRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const listing = await getJobListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Job listing not found" });
      return;
    }
    if (listing.posterId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not authorized to update this listing" });
      return;
    }

    const { title, description, company, location, jobType, salaryMin, salaryMax, category, status } = req.body;
    const updated = await updateJobListing(req.params.id, {
      title,
      description,
      company,
      location,
      jobType,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      category,
      status,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update job listing error:", err);
    res.status(500).json({ success: false, error: "Failed to update job listing" });
  }
});

jobsRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const listing = await getJobListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Job listing not found" });
      return;
    }
    if (listing.posterId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not authorized to delete this listing" });
      return;
    }

    await deleteJobListing(req.params.id);
    res.json({ success: true, data: { message: "Job listing deleted" } });
  } catch (err) {
    console.error("Delete job listing error:", err);
    res.status(500).json({ success: false, error: "Failed to delete job listing" });
  }
});

jobsRouter.post("/:id/apply", authMiddleware, async (req, res) => {
  try {
    const listing = await getJobListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Job listing not found" });
      return;
    }
    if (listing.posterId === req.user!.userId) {
      res.status(400).json({ success: false, error: "Cannot apply to your own listing" });
      return;
    }
    if (listing.status !== "active") {
      res.status(400).json({ success: false, error: "This job listing is no longer active" });
      return;
    }

    const { resumeUrl, coverLetter } = req.body;
    const application = await createJobApplication({
      listingId: req.params.id,
      applicantId: req.user!.userId,
      resumeUrl,
      coverLetter,
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error("Create application error:", err);
    res.status(500).json({ success: false, error: "Failed to submit application" });
  }
});

jobsRouter.put("/:id/applications/:applicationId", authMiddleware, async (req, res) => {
  try {
    const listing = await getJobListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Job listing not found" });
      return;
    }
    if (listing.posterId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not authorized to manage applications" });
      return;
    }

    const { status } = req.body;
    if (!status || !["reviewed", "shortlisted", "rejected", "accepted"].includes(status)) {
      res.status(400).json({ success: false, error: "Invalid status" });
      return;
    }

    const application = await updateJobApplication(req.params.applicationId, { status });
    res.json({ success: true, data: application });
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ success: false, error: "Failed to update application" });
  }
});
