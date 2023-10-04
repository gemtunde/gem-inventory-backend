const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const { upload } = require("../utils/fileUpload");

router.post("/", protect, upload.single("image"), createProduct);
router.get("/", protect, getProducts);
router.get("/:productid", protect, getProduct);
router.delete("/:id", protect, deleteProduct);
router.patch("/:productid", protect, upload.single("image"), updateProduct);

module.exports = router;
