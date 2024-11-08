const express = require("express");
const {
  getOrderPage,
  sendOrder,
  answerOrder,
  getInfo,
} = require("../controllers/Orders");
const router = express.Router();

router.route("/orderPage").get(getOrderPage);
router.route("/order").post(sendOrder).patch(answerOrder);
router.route("/info").get(getInfo);

module.exports = router;
