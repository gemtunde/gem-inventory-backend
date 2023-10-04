const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
//const cloudinary = require("cloudinary").v2;
const cloudinary = require("../config/cloudinaryConfig");

//add product
const createProduct = async (req, res) => {
  //res.send("product");
  try {
    const { name, sku, category, quantity, price, description } = req.body;

    //validation
    if (!name || !category || !price || !quantity || !description) {
      res.status(400);
      throw new Error("Please fill all fields");
    }

    //handle image upload
    let fileData = {};

    if (req.file) {
      // save image to clodinary
      // Save image to cloudinary
      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {
          folder: "Inventory App",
          resource_type: "image",
        });
      } catch (error) {
        res.status(500);
        throw new Error("Image could not be uploaded");
      }
      // save image to clodinary

      fileData = {
        fileName: req.file.originalname,
        filePath: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2),
      };
    }

    //create product
    const product = await Product.create({
      user: req.user._id,
      name,
      sku,
      category,
      quantity,
      price,
      description,
      image: fileData,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

//get all products by user
// req.user.id is comming from the middleware "protect" in the productroute. used for authentication
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id }).sort(
      "-createdAt"
    );
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

//get single product by product id

const getProduct = async (req, res) => {
  try {
    const { productid } = req.params;
    const product = await Product.findById({ _id: productid });

    if (!product) {
      res.status(400);
      throw new Error("Product not found");
    }
    if (product.user.toString() !== req.user.id) {
      res.status(400);
      throw new Error("User not authorized");
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

//delete product

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(400);
      throw new Error("Product not found");
    }

    //check if user id matches
    if (product.user.toString() !== req.user.id) {
      res.status(400);
      throw new Error("User not authorized");
    }
    //remove product
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json("Product deleted");
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

//update product
const updateProduct = async (req, res) => {
  //res.send("product");
  try {
    const { name, category, quantity, price, description } = req.body;

    const { productid } = req.params;
    const product = await Product.findById({ _id: productid });

    //check if product is in db
    if (!product) {
      res.status(400);
      throw new Error("Product not found");
    }

    //check if user id matches
    if (product.user.toString() !== req.user.id) {
      res.status(400);
      throw new Error("User not authorized");
    }

    //validation
    if (!name || !category || !price || !quantity || !description) {
      res.status(400);
      throw new Error("Please fill all fields");
    }

    //handle image upload
    let fileData = {};

    if (req.file) {
      // save image to clodinary
      // Save image to cloudinary
      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {
          folder: "Inventory App",
          resource_type: "image",
        });
      } catch (error) {
        res.status(500);
        throw new Error("Image could not be uploaded");
      }
      // save image to clodinary

      fileData = {
        fileName: req.file.originalname,
        filePath: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2),
      };
    }

    //update product
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: productid },
      {
        name,
        category,
        quantity,
        price,
        description,
        image: Object.keys(fileData).length === 0 ? product?.image : fileData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
