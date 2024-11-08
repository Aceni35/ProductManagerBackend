const express = require("express");
const {
  getSingleDay,
  getProductsSoldByMonth,
  getCompanyPurchasesByMonth,
  getCompanySalesByMonth,
  getProductSalesYears,
  getProducts,
  getCompanies,
  getCompanyPurchases,
  getCompanySales,
  getReceipt,
} = require("../controllers/Analytics");
const router = express.Router();

router.route("/singleDay").get(getSingleDay);
router.route("/getProductsSoldByMonth").get(getProductsSoldByMonth);
router.route("/getCompanyPurchasesByMonth").get(getCompanyPurchasesByMonth);
router.route("/getCompanySalesByMonth").get(getCompanySalesByMonth);
router.route("/getProductSalesYears").get(getProductSalesYears);
router.route("/getAnalyticsProducts").get(getProducts);
router.route("/getAnalyticsCompanies").get(getCompanies);
router.route("/getCompanyPurchases").get(getCompanyPurchases);
router.route("/getCompanySales").get(getCompanySales);
router.route("/getReceipts").get(getReceipt);

module.exports = router;
