import express from "express";
import { getMessages, sendMessage, deleteMessage } from "../controllers/chatController.js";
import { validate } from "../middleware/validate.js";
import { sendMessageSchema, listMessagesSchema, messageIdParamSchema } from "../schemas/chatSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireChatMessageAuthor } from "../middleware/authorize.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// Nested chat routes under /workspaces/:workspaceId/chat
// Membership is enforced by the parent workspace route.
nestedRouter.get('/', validate(listMessagesSchema), asyncHandler(getMessages));
nestedRouter.post('/', validate(sendMessageSchema), asyncHandler(sendMessage));

// Direct chat routes under /chat
router.delete('/:messageId', validate(messageIdParamSchema), requireChatMessageAuthor, asyncHandler(deleteMessage));