import express from "express";
import { getMyProfile, updateMyProfile, searchUsers, getUserById } from "../controllers/userController.js";
import { getRecent, logVisit } from "../controllers/activityController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema, searchUsersSchema, userIdParamSchema, logVisitSchema, getRecentSchema } from "../schemas/userSchema.js";

const router = express.Router();

router.get('/me', asyncHandler(getMyProfile));
router.put('/me', validate(updateProfileSchema), asyncHandler(updateMyProfile));
router.get('/me/recent', validate(getRecentSchema), asyncHandler(getRecent));
router.post('/me/recent', validate(logVisitSchema), asyncHandler(logVisit));
router.get('/search', validate(searchUsersSchema), asyncHandler(searchUsers));
router.get('/:userId', validate(userIdParamSchema), asyncHandler(getUserById));

export default router;
