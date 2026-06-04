import { Router } from "express";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);
notificationRoutes.get("/", listNotifications);
notificationRoutes.post("/read-all", markAllNotificationsRead);
notificationRoutes.post("/:notificationId/read", markNotificationRead);
