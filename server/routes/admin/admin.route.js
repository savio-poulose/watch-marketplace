import express from "express"
const router = express.Router()

import {adminLogin} from "../../controllers/admin/admin.controller.js"

router.post("/login",adminLogin)

export default adminLogin