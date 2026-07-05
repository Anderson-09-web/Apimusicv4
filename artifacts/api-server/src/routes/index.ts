import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import searchRouter from "./music/search.js";
import playerRouter from "./music/player.js";
import queueRouter from "./music/queue.js";
import nodesRouter from "./music/nodes.js";
import voiceRouter from "./music/voice.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(searchRouter);
router.use(playerRouter);
router.use(queueRouter);
router.use(nodesRouter);
router.use(voiceRouter);

export default router;
