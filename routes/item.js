const { Router } = require("express");
const {
  addProduct,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getCategoryItem,
  getStoreItem,
  getSupplierItem,
  getItemsCount,
} = require("../controllers/item");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const router = Router();

router.post("/add-item", auth, admin, addProduct);
router.get("/", getItems);
router.get("/:id", getItemById);
router.get("/ ", getCategoryItem);
router.get("/store/:storeId", getStoreItem);
router.get("/supplier/:supplierId", getSupplierItem);
router.get("/items-count", getItemsCount);
router.put("/update/:id", auth, admin, updateItem);
router.delete("/delete/:id", auth, admin, deleteItem);

module.exports = router;
