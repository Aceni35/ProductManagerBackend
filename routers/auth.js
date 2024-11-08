const express = require("express");
const router = express.Router();
const { RegisterCompany, Login, getInfo } = require("../controllers/auth");

router.route("/register").post(RegisterCompany);
router.route("/login").post(Login);

module.exports = router;
