import express from "express";
import { messageController } from "./message.controller.js";

export const router = express.Router();

router.get("/:id", messageController.getOne);

router.post("/conversation", messageController.getConversation);

router.put("/:id", messageController.update);

router.post("/", messageController.create);

router.delete("/:id", messageController.delete);