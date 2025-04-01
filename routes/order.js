const { Router } = require("express");
const {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  facture,
  applyDiscount,
  payOrder,
} = require("../controllers/order");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/manager");
const manager = require("../middlewares/manager");
const cashier = require("../middlewares/cashier");

const router = Router();

router.post("/create-order", auth, createOrder);
router.post("/add-items", auth, addItemToOrder);
router.delete("/:orderId/items", auth, admin, manager, removeItemFromOrder);
router.get("/facture/:orderId", auth, facture);
router.patch("/order/:orderId/discount", auth, admin, manager, applyDiscount);
router.patch("/order/:orderId/pay", auth, cashier, payOrder);

module.exports = router;
