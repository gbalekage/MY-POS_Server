const express = require("express");
const {
  addTables,
  getTables,
  getTableById,
  getUserTable,
  getOrderTable,
} = require("../controllers/table");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

const router = express.Router();

router.post("/add-tables", auth, admin, addTables);
router.get("/", getTables);
router.get("/:id", getTableById);
router.get("/user/:userId", getUserTable);
router.get("/order/:orderId", getOrderTable);

module.exports = router;
