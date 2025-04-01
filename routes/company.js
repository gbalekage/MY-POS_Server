const { Router } = require("express");
const { addCompany, editCompany, addLogo } = require("../controllers/company");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

const router = Router();

router.post("/add-company", addCompany);
router.put("/update/:id", auth, admin, editCompany);
router.post("/logo/:id", auth, admin, addLogo);

module.exports = router;
