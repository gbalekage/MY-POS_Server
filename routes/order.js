const { Router } = require("express");
const createOrder = require("../controllers/order");
const auth = require("../middlewares/auth");

const router = Router();

router.post("/create-order", auth, createOrder);

module.exports = router;
