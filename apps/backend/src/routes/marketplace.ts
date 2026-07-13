import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { upload, uploadFile } from "../utils/upload";
import {
  createMarketplaceListing,
  getMarketplaceListings,
  getMarketplaceListingById,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  getMarketplaceListingsBySeller,
  createMarketplaceOffer,
  updateMarketplaceOffer,
  getMarketplaceOffersForSeller,
  getMarketplaceOffererOffers,
} from "@thrift/db";

export const marketplaceRouter = Router();

marketplaceRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

    const result = await getMarketplaceListings({ page, limit, category, search, minPrice, maxPrice });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get marketplace listings error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch listings" });
  }
});

marketplaceRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getMarketplaceListingsBySeller(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get my listings error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your listings" });
  }
});

marketplaceRouter.get("/my-offers", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getMarketplaceOffererOffers(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get my offers error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your offers" });
  }
});

marketplaceRouter.get("/received-offers", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getMarketplaceOffersForSeller(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get received offers error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch received offers" });
  }
});

marketplaceRouter.post("/", authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, currency, category, condition } = req.body;

    if (!title || !description || !price || !category || !condition) {
      res.status(400).json({ success: false, error: "Title, description, price, category, and condition are required" });
      return;
    }

    if (price <= 0) {
      res.status(400).json({ success: false, error: "Price must be greater than 0" });
      return;
    }

    let imageUrl: string | undefined;

    if (req.file) {
      const result = await uploadFile(req.file, 'marketplace');
      imageUrl = result.url;
    }

    const listing = await createMarketplaceListing({
      sellerId: req.user!.userId,
      title,
      description,
      price: Number(price),
      currency: currency || "NGN",
      category,
      condition,
      imageUrl,
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    console.error("Create listing error:", err);
    res.status(500).json({ success: false, error: "Failed to create listing" });
  }
});

marketplaceRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const listing = await getMarketplaceListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }
    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch listing" });
  }
});

marketplaceRouter.put("/:id", authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const listing = await getMarketplaceListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }
    if (listing.sellerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not authorized to update this listing" });
      return;
    }

    const { title, description, price, category, condition, status, imageUrl: imageUrlBody } = req.body;
    
    let imageUrl: string | null | undefined;
    if (req.file) {
      const result = await uploadFile(req.file, 'marketplace');
      imageUrl = result.url;
    } else if (imageUrlBody === "") {
      imageUrl = null;
    }

    const updated = await updateMarketplaceListing(req.params.id, {
      title,
      description,
      price: price ? Number(price) : undefined,
      category,
      condition,
      imageUrl: imageUrl,
      status,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update listing error:", err);
    res.status(500).json({ success: false, error: "Failed to update listing" });
  }
});

marketplaceRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const listing = await getMarketplaceListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }
    if (listing.sellerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not authorized to delete this listing" });
      return;
    }

    await deleteMarketplaceListing(req.params.id);
    res.json({ success: true, data: { message: "Listing deleted" } });
  } catch (err) {
    console.error("Delete listing error:", err);
    res.status(500).json({ success: false, error: "Failed to delete listing" });
  }
});

marketplaceRouter.post("/:id/offers", authMiddleware, async (req, res) => {
  try {
    const listing = await getMarketplaceListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }
    if (listing.sellerId === req.user!.userId) {
      res.status(400).json({ success: false, error: "Cannot make an offer on your own listing" });
      return;
    }
    if (listing.status !== "active") {
      res.status(400).json({ success: false, error: "This listing is no longer active" });
      return;
    }

    const { amount, message } = req.body;
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: "A valid offer amount is required" });
      return;
    }

    const offer = await createMarketplaceOffer({
      listingId: req.params.id,
      offererId: req.user!.userId,
      amount: Number(amount),
      message,
    });

    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    console.error("Create offer error:", err);
    res.status(500).json({ success: false, error: "Failed to create offer" });
  }
});

marketplaceRouter.put("/:id/offers/:offerId", authMiddleware, async (req, res) => {
  try {
    const listing = await getMarketplaceListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }
    if (listing.sellerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not authorized to manage offers on this listing" });
      return;
    }

    const { status } = req.body;
    if (!status || !["accepted", "rejected"].includes(status)) {
      res.status(400).json({ success: false, error: "Status must be 'accepted' or 'rejected'" });
      return;
    }

    const offer = await updateMarketplaceOffer(req.params.offerId, { status });

    if (status === "accepted") {
      await updateMarketplaceListing(req.params.id, { status: "sold" });
    }

    res.json({ success: true, data: offer });
  } catch (err) {
    console.error("Update offer error:", err);
    res.status(500).json({ success: false, error: "Failed to update offer" });
  }
});
