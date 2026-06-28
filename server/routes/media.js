import express from "express";

import authMiddleware from "../middleware/auth.js";
import Media from "../models/Media.js";

const router = express.Router();

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
