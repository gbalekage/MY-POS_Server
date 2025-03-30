const { Router } = require("express");
const { createOrder, addItemToOrder } = require("../controllers/order");
const auth = require("../middlewares/auth");

const router = Router();

router.post("/create-order", auth, createOrder);
router.post("/add-items", auth, addItemToOrder);

module.exports = router;
