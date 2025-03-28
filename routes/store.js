const { Router } = require("express");
const auth = require("../middlewares/auth");
const {
  addStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
} = require("../controllers/store");
const admin = require("../middlewares/admin");

const router = Router();

router.post("/new-store", auth, admin, addStore);
router.get("/", getStores);
router.get("/:id", getStoreById);
router.put("/edit/:id", auth, admin, updateStore);
router.delete("/delete/:id", auth, admin, deleteStore);

module.exports = router;
