/**
 * @route /api/v1/transaction
 */
const { Router } = require("express");

const {
  approveTransaction,
  getOneTransaction,
  getAllTransactions,
  rejectTransaction,
  createTransaction,
  calculateProfits,
  deleteTransaction,
  getTransactionsByUserId,
} = require("../controller/transaction.controller");

const { protect, allowedRoles } = require("../services/auth.service");
const {
  createTransactionValidator,
  approveTransactionValidator,
  rejectTransactionValidator,
  getTransactionValidator,
} = require("../utils/validations/transaction.validation");

const router = Router();

// protected
router.use(protect);

router.route("/").post(createTransactionValidator, createTransaction);

// Get user's own transactions
router.route("/user").get(getTransactionsByUserId);

// private [admin]
router.use(allowedRoles("Admin"));

router.route("/").get(getAllTransactions);

router
  .route("/approve/:id")
  .post(approveTransactionValidator, approveTransaction);

router.route("/reject/:id").post(rejectTransactionValidator, rejectTransaction);

router.route("/calculateProfits/:id").put(calculateProfits);

router.route("/delete/:id").delete(deleteTransaction);

router.route("/:id").get(getTransactionValidator, getOneTransaction);

module.exports = router;
