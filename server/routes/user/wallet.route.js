
import express from "express";
import {
  getMyWallet,
  getMyWalletTransactions,
} from "../../controllers/user/wallet.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMyWallet);
router.get("/transactions", authMiddleware, getMyWalletTransactions);

export default router;
