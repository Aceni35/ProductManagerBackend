const express = require("express");
const router = express.Router();
const {
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
  getOperators,
  addOperator,
  removeOperator,
  editOperator,
  updatePassword,
  getAccount,
  addCompany,
  removeCompany,
} = require("../controllers/Management");
const { changeOperator } = require("../controllers/Orders");

router.route("/getProducts").get(getProducts);
router.route("/addProduct").post(addProduct);
router.route("/editProduct").patch(editProduct);
router.route("/deleteProduct").delete(deleteProduct);
router
  .route("/operators")
  .get(getOperators)
  .post(addOperator)
  .delete(removeOperator)
  .patch(editOperator);
router.route("/password").patch(updatePassword);
router.route("/account").get(getAccount);
router.route("/companies").patch(addCompany).delete(removeCompany);
router.route("/changeOperator").post(changeOperator);

module.exports = router;
