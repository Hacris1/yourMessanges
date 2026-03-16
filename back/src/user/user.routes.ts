import express from "express";
import { userController } from "./user.controller.js";

export const router = express.Router();

router.post("/login", userController.login);
router.post("/regenerateKeys", userController.regenerateKeys);
router.post("/deactivateAccount", userController.deactivateAccount);
router.post("/deleteAccount", userController.deleteAccount);
router.post("/updatePublickey", userController.sendPublicKey);
router.get("/publicKey/:id", userController.getPublicKey);

// Rutas del CRUD
router.post("/", userController.create);
router.get("/", userController.getAll);
router.get("/:id", userController.getOne);
router.put("/:id", userController.update);
router.delete("/:id", userController.delete);