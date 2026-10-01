import express from "express"
import { getAllUsers,toggleBlockUser } from "../../controllers/admin/users.controller.js"
import {adminAuth} from "../../middlewares/auth.middleware.js"

const router = express.Router()


router.get("/",adminAuth,getAllUsers)

router.patch("/:id/block",adminAuth,toggleBlockUser)


export default router