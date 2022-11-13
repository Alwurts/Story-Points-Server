import express from "express";
import auth from "../controllers/auth.controller";

const router = express.Router();

router.post("/api/auth/signup", auth.signup);
router.post("/api/auth/signin", auth.signin);

export { router as authRouter };
