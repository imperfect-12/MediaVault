import express from "express";
import { v2 as cloudinary } from "cloudinary";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/signature", authMiddleware, (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = req.body?.folder || "mediavault";

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  });
});

export default router;
