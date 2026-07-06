import { Router, type IRouter } from "express";
import { NotFoundError } from "../lib/errors.js";
import healthRouter from "./health.js";
import keysRouter from "./keys.js";
import searchRouter from "./music/search.js";
import playerRouter from "./music/player.js";
import queueRouter from "./music/queue.js";
import nodesRouter from "./music/nodes.js";
import voiceRouter from "./music/voice.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(keysRouter);
router.use(searchRouter);
router.use(playerRouter);
router.use(queueRouter);
router.use(nodesRouter);
router.use(voiceRouter);

// Catch-all for unmatched API routes — return 404 instead of falling through
router.use((_req, _res, next) => {
  next(new NotFoundError("API endpoint not found"));
});

export default router;
