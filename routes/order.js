const { Router } = require("express");
const {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  facture,
} = require("../controllers/order");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/manager");
const manager = require("../middlewares/manager");

const router = Router();

router.post("/create-order", auth, createOrder);
router.post("/add-items", auth, addItemToOrder);
router.delete("/:orderId/items", auth, manager, removeItemFromOrder);
router.get("/facture/:orderId", auth, facture);

module.exports = router;
