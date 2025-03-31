const { Router } = require("express");
const {
  addSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplier");
const auth = require("../middlewares/auth");
const manager = require("../middlewares/manager");
const router = Router();

router.post("/add-supplier", auth, manager, addSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", auth, manager, updateSupplier);
router.delete("/:id", auth, manager, deleteSupplier);

module.exports = router;
