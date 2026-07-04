import express from "express";
import { getTaskLabels, setTaskLabels } from "../controllers/taskLabelController.js";
import { validate } from "../middleware/validate.js";
import { setTaskLabelsSchema } from "../schemas/boardLabelSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const router = express.Router({ mergeParams: true });

router.get('/', asyncHandler(getTaskLabels));
router.put('/', validate(setTaskLabelsSchema), asyncHandler(setTaskLabels));
