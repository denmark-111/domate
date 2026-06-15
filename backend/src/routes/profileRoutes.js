import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/profileSchema.js";

const router = express.Router();

router.get('/', asyncHandler(getProfile));
router.put('/', validate(updateProfileSchema), asyncHandler(updateProfile));

export default router;
