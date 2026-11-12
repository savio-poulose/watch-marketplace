
import { Router } from "express";

import {
  getAdminWalletSummary,
  getAdminWallets,
  getAdminWalletTransactions,
  creditCustomerWallet,
} from "../../controllers/admin/adminWallet.controller.js";

import { adminAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary",adminAuth, getAdminWalletSummary);
router.get("/transactions", adminAuth, getAdminWalletTransactions);
router.get("/", adminAuth, getAdminWallets);
router.post("/:userId/credit", adminAuth, creditCustomerWallet);

export default router;
