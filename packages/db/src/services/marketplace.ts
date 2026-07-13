import { prisma } from "./prisma";

export async function createMarketplaceListing(data: {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  condition: string;
  imageUrl?: string;
}) {
  return prisma.marketplaceListing.create({ data });
}

export async function getMarketplaceListings(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, category, search, minPrice, maxPrice, status = "active" } = params;
  const where: Record<string, unknown> = { status };

  if (category) where.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) (where.price as Record<string, number>).gte = minPrice;
    if (maxPrice !== undefined) (where.price as Record<string, number>).lte = maxPrice;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, email: true } }, _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMarketplaceListingById(id: string) {
  return prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      offers: {
        include: { offerer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateMarketplaceListing(id: string, data: {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  imageUrl?: string | null;
  status?: string;
}) {
  return prisma.marketplaceListing.update({ where: { id }, data });
}

export async function deleteMarketplaceListing(id: string) {
  return prisma.marketplaceListing.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getMarketplaceListingsBySeller(sellerId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total, allListings] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { sellerId },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where: { sellerId } }),
    prisma.marketplaceListing.findMany({
      where: { sellerId },
      select: { status: true },
    }),
  ]);

  const stats = {
    total: allListings.length,
    activeCount: allListings.filter((l) => l.status === "active").length,
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function createMarketplaceOffer(data: {
  listingId: string;
  offererId: string;
  amount: number;
  message?: string;
}) {
  return prisma.marketplaceOffer.create({
    data,
    include: {
      offerer: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, price: true, currency: true } },
    },
  });
}

export async function updateMarketplaceOffer(id: string, data: { status: string }) {
  return prisma.marketplaceOffer.update({
    where: { id },
    data,
    include: {
      offerer: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, price: true, currency: true } },
    },
  });
}

export async function getMarketplaceOffersByListing(listingId: string) {
  return prisma.marketplaceOffer.findMany({
    where: { listingId },
    include: { offerer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMarketplaceOffersForSeller(sellerId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total, allOffers] = await Promise.all([
    prisma.marketplaceOffer.findMany({
      where: { listing: { sellerId } },
      include: {
        offerer: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, price: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceOffer.count({ where: { listing: { sellerId } } }),
    prisma.marketplaceOffer.findMany({
      where: { listing: { sellerId } },
      select: { status: true },
    }),
  ]);

  const stats = {
    total: allOffers.length,
    pendingCount: allOffers.filter((o) => o.status === "pending").length,
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getMarketplaceOffererOffers(offererId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total, allOffers] = await Promise.all([
    prisma.marketplaceOffer.findMany({
      where: { offererId },
      include: {
        listing: {
          select: { id: true, title: true, price: true, currency: true, seller: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceOffer.count({ where: { offererId } }),
    prisma.marketplaceOffer.findMany({
      where: { offererId },
      select: { status: true },
    }),
  ]);

  const stats = {
    total: allOffers.length,
    acceptedCount: allOffers.filter((o) => o.status === "accepted").length,
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}
