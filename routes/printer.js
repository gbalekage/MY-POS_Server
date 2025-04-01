const { Router } = require("express");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const {
  addPrinter,
  getPrinters,
  getPrinterById,
  updatePrinter,
  deletePrinter,
  testPrinter,
} = require("../controllers/printer");
const manager = require("../middlewares/manager");

const router = Router();

router.post("/add-printer", auth, admin, manager, addPrinter);
router.get("/", getPrinters);
router.get("/:id", getPrinterById);
router.put("/edit/:id", auth, admin, updatePrinter);
router.delete("/delete/:id", auth, admin, deletePrinter);
router.post("/test", auth, admin, testPrinter);

module.exports = router;
