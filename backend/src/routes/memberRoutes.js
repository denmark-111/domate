import express from "express";
import { getWorkspaceMembers } from "../controllers/memberController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const nestedRouter = express.Router({ mergeParams: true });

nestedRouter.get("/", asyncHandler(getWorkspaceMembers));
