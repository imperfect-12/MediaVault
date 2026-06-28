import express from "express";

import authMiddleware from "../middleware/auth.js";
import Media from "../models/Media.js";

const router = express.Router();
const MAX_BULK_MEDIA = 20;
const allowedTypes = ["manga", "anime", "game"];

const allowedFields = ["name", "description", "imageUrl", "type", "status", "rating", "isFavourite"];

const cleanMediaPayload = (body) => {
  const payload = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  }

  if (typeof payload.name === "string") {
    payload.name = payload.name.trim();
  }

  if (typeof payload.description === "string") {
    payload.description = payload.description.slice(0, 300);
  }

  if (payload.rating === "" || payload.rating === undefined) {
    payload.rating = null;
  }

  return payload;
};

router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const filter = { user: req.user.id };
    const { type } = req.query;

    if (type && ["manga", "anime", "game"].includes(type)) {
      filter.type = type;
    }

    const media = await Media.find(filter).sort({ createdAt: -1 });
    return res.json({ media });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = cleanMediaPayload(req.body);

    if (!payload.name || !payload.type) {
      return res.status(400).json({ message: "Name and type are required." });
    }

    const media = await Media.create({
      ...payload,
      user: req.user.id,
    });

    return res.status(201).json({ media });
  } catch (error) {
    return next(error);
  }
});

router.post("/bulk", async (req, res, next) => {
  try {
    const items = req.body?.media;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Add at least one media entry." });
    }

    if (items.length > MAX_BULK_MEDIA) {
      return res.status(400).json({ message: `Bulk uploads are limited to ${MAX_BULK_MEDIA} entries.` });
    }

    const invalidShapeIndex = items.findIndex(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    );

    if (invalidShapeIndex !== -1) {
      return res.status(400).json({ message: `Entry ${invalidShapeIndex + 1} is not valid.` });
    }

    const payloads = items.map((item) => {
      const payload = cleanMediaPayload(item);
      return {
        name: payload.name,
        type: payload.type,
        imageUrl: payload.imageUrl || "",
        description: "",
        status: "planning",
        rating: null,
        isFavourite: false,
        user: req.user.id,
      };
    });

    const invalidIndex = payloads.findIndex(
      (payload) => !payload.name || !allowedTypes.includes(payload.type),
    );

    if (invalidIndex !== -1) {
      return res.status(400).json({
        message: `Entry ${invalidIndex + 1} needs a name and a valid media type.`,
      });
    }

    const media = await Media.insertMany(payloads);
    return res.status(201).json({ media });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const media = await Media.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      cleanMediaPayload(req.body),
      { new: true, runValidators: true },
    );

    if (!media) {
      return res.status(404).json({ message: "Media entry not found." });
    }

    return res.json({ media });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const media = await Media.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!media) {
      return res.status(404).json({ message: "Media entry not found." });
    }

    return res.json({ message: "Media entry deleted.", id: req.params.id });
  } catch (error) {
    return next(error);
  }
});

export default router;
