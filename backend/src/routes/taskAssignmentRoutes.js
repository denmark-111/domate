import express from "express";
import { getTaskAssignees, setTaskAssignees } from "../controllers/taskAssignmentController.js";
import { validate } from "../middleware/validate.js";
import { setTaskAssigneesSchema } from "../schemas/taskAssignmentSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const nestedRouter = express.Router({ mergeParams: true });

nestedRouter.get("/", asyncHandler(getTaskAssignees));
nestedRouter.put("/", validate(setTaskAssigneesSchema), asyncHandler(setTaskAssignees));
