const { Router } = require("express");
const {
  register,
  loginUser,
  getUser,
  getAuthors,
  avatar,
  editUser,
  deleteUser,
} = require("../controllers/user");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

const router = Router();

router.post("/new-user", register);
router.post("/login-user", loginUser);
router.get("/", getAuthors);
router.get("/:id", getUser);
router.post("/avatar", auth, avatar);
router.put("/update/:id", auth, admin, editUser);
router.delete("/delete/:id", auth, admin, deleteUser);

module.exports = router;
