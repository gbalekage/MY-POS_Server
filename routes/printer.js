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

const router = Router();

router.post("/add-printer", auth, admin, addPrinter);
router.get("/:id", getPrinterById);
router.get("/", getPrinters);
router.put("/edit/:id", auth, admin, updatePrinter);
router.delete("/delete/:id", auth, admin, deletePrinter);
router.post("/test", auth, admin, testPrinter);

module.exports = router;
