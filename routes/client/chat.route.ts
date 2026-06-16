import { Router } from "express";
import * as chatController from "../../controllers/client/chat.controller";

const router = Router();

router.post("/api", chatController.chatApi);

export default router;
