import { Router } from "express";
import { acceptConnection, getConnectionStatus, listMyConnections, listReceivedConnections, listRequests, listSentConnections, rejectConnection, requestConnection } from "../controllers/connectionController.js";
import { requireAuth } from "../middleware/auth.js";

export const connectionRoutes = Router();

connectionRoutes.use(requireAuth);
connectionRoutes.post("/request/:userId", requestConnection);
connectionRoutes.post("/accept/:connectionId", acceptConnection);
connectionRoutes.post("/reject/:connectionId", rejectConnection);
connectionRoutes.get("/me", listMyConnections);
connectionRoutes.get("/requests", listRequests);
connectionRoutes.get("/sent", listSentConnections);
connectionRoutes.get("/received", listReceivedConnections);
connectionRoutes.get("/status/:userId", getConnectionStatus);
