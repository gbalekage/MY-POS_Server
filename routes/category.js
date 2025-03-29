const { Router } = require("express");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category");

const router = Router();

router.post("/add-category", auth, admin, addCategory);
router.get("/", auth, getCategories);
router.get("/:id", auth, getCategoryById);
router.put("/edit/:id", auth, admin, updateCategory);
router.delete("/delete/:id", auth, admin, deleteCategory);

module.exports = router;
