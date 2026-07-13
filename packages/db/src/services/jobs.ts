import { prisma } from "./prisma";

export async function createJobListing(data: {
  posterId: string;
  title: string;
  description: string;
  company?: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  category: string;
}) {
  return prisma.jobListing.create({ data });
}

export async function getJobListings(params: {
  page?: number;
  limit?: number;
  category?: string;
  jobType?: string;
  search?: string;
  status?: string;
}) {
  const { page = 1, limit = 20, category, jobType, search, status = "active" } = params;
  const where: Record<string, unknown> = { status };

  if (category) where.category = category;
  if (jobType) where.jobType = jobType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      include: { poster: { select: { id: true, name: true, email: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getJobListingById(id: string) {
  return prisma.jobListing.findUnique({
    where: { id },
    include: {
      poster: { select: { id: true, name: true, email: true } },
      applications: {
        include: { applicant: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateJobListing(id: string, data: {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  category?: string;
  status?: string;
}) {
  return prisma.jobListing.update({ where: { id }, data });
}

export async function deleteJobListing(id: string) {
  return prisma.jobListing.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getJobListingsByPoster(posterId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total, allListings] = await Promise.all([
    prisma.jobListing.findMany({
      where: { posterId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobListing.count({ where: { posterId } }),
    prisma.jobListing.findMany({
      where: { posterId },
      select: { status: true },
    }),
  ]);

  const stats = {
    total: allListings.length,
    activeCount: allListings.filter((l) => l.status === "active").length,
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function createJobApplication(data: {
  listingId: string;
  applicantId: string;
  resumeUrl?: string;
  coverLetter?: string;
}) {
  return prisma.jobApplication.create({
    data,
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, company: true, location: true } },
    },
  });
}

export async function updateJobApplication(id: string, data: { status: string }) {
  return prisma.jobApplication.update({
    where: { id },
    data,
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, company: true, location: true } },
    },
  });
}

export async function getJobApplicationsByListing(listingId: string) {
  return prisma.jobApplication.findMany({
    where: { listingId },
    include: { applicant: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobApplicationsByApplicant(applicantId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total, allApps] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { applicantId },
      include: {
        listing: {
          select: { id: true, title: true, company: true, location: true, jobType: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobApplication.count({ where: { applicantId } }),
    prisma.jobApplication.findMany({
      where: { applicantId },
      select: { status: true },
    }),
  ]);

  const stats = {
    total: allApps.length,
    successfulCount: allApps.filter((a) => a.status === "shortlisted" || a.status === "accepted").length,
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getJobApplicationsForPoster(posterId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total, allApps] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { listing: { posterId } },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, company: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobApplication.count({ where: { listing: { posterId } } }),
    prisma.jobApplication.findMany({
      where: { listing: { posterId } },
      select: { status: true },
    }),
  ]);

  const stats = {
    total: allApps.length,
    pendingCount: allApps.filter((a) => a.status === "pending").length,
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getJobApplicationById(id: string) {
  return prisma.jobApplication.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      listing: {
        select: {
          id: true, title: true, description: true, company: true, location: true,
          jobType: true, salaryMin: true, salaryMax: true, currency: true, category: true,
          status: true, createdAt: true,
          poster: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}
