
import { Router } from "express";

import {
  getAdminWalletSummary,
  getAdminWallets,
  getAdminWalletTransactions,
  creditCustomerWallet,
} from "../../controllers/admin/adminWallet.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary", authMiddleware, getAdminWalletSummary);
router.get("/transactions", authMiddleware, getAdminWalletTransactions);
router.get("/", authMiddleware, getAdminWallets);
router.post("/:userId/credit", authMiddleware, creditCustomerWallet);

export default router;
