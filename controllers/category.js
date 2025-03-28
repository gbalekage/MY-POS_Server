const Category = require("../models/category");
const HttpError = require("../models/error");

const addCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return next(new HttpError("Please provide a category name", 400));
    }
    const category = await Category.create({ name });
    if (!category) {
      return next(new HttpError("Failed to add the category", 400));
    }
    res.status(201).json(category);
  } catch (error) {
    return next(
      new HttpError("Failed to add the category, please try again later")
    );
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    if (!categories) {
      return next(new HttpError("No categories found", 404));
    }
    res.status(200).json(categories);
  } catch (error) {
    return next(new HttpError("Failed to fetch categories", 500));
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return next(new HttpError("Category not found", 404));
    }
    res.status(200).json(category);
  } catch (error) {
    return next(new HttpError("Failed to fetch category", 500));
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return next(new HttpError("Please provide a category name", 400));
    }
    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!category) {
      return next(new HttpError("Failed to update the category", 400));
    }
    res.status(200).json(category);
  } catch (error) {
    return next(new HttpError("Failed to update the category", 500));
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return next(new HttpError("Failed to delete the category", 400));
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return next(new HttpError("Failed to delete the category", 500));
  }
};

module.exports = {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
