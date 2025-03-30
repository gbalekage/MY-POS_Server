const Item = require("../models/item");
const HttpError = require("../models/error");

const addProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      barCode,
      category,
      store,
      supplier,
      purchasePrice,
      sellingPrice,
      packageSize,
      stock,
      tax = 0,
      currency = "FC",
      status = "active",
    } = req.body;

    if (
      !name ||
      !description ||
      !barCode ||
      !category ||
      !store ||
      !supplier ||
      purchasePrice == null ||
      sellingPrice == null ||
      !packageSize ||
      stock == null
    ) {
      return next(new HttpError("Veuillez remplir tous les champs", 422));
    }

    if (sellingPrice < purchasePrice) {
      return next(
        new HttpError(
          "Le prix de vente doit être supérieur ou égal au prix d'achat",
          422
        )
      );
    }

    const itemExists = await Item.findOne({ barCode });
    if (itemExists) {
      return next(new HttpError("Le produit existe déjà", 422));
    }

    const newItem = new Item({
      name,
      description,
      barCode,
      category,
      store,
      supplier,
      purchasePrice,
      sellingPrice,
      packageSize,
      stock,
      tax,
      currency,
      status,
    });

    newItem.activityLogs.push({
      action: "added",
      quantity: stock,
      user: req.user.id,
    });

    await newItem.save();

    res.status(201).json(newItem);
  } catch (error) {
    return next(
      new HttpError(error.message || "Erreur lors de l'ajout du produit", 500)
    );
  }
};

const getItems = async (req, res, next) => {
  try {
    const produit = await Item.find({})
      .populate("supplier")
      .populate("category")
      .populate("store");

    res.status(200).json(produit);
  } catch (error) {
    return next(new HttpError("Failed to get items"));
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) {
      return next(new HttpError("Item not found", 404));
    }
    res.status(200).json(item);
  } catch (error) {
    return next(new HttpError("Failed to get the item", 400));
  }
};

const updateItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      barCode,
      category,
      store,
      supplier,
      purchasePrice,
      sellingPrice,
      packageSize,
      stock,
      tax = 0,
      currency = "FC",
      status = "active",
    } = req.body;

    const { id } = req.params;
    const userId = req.user.id;

    const item = await Item.findById(id);

    if (!item) {
      return next(new HttpError("Item not found", 404));
    }

    let changesMade = false;

    if (name) item.name = name;
    if (description) item.description = description;
    if (barCode) item.barCode = barCode;
    if (category) item.category = category;
    if (store) item.store = store;
    if (supplier) item.supplier = supplier;
    if (purchasePrice) item.purchasePrice = purchasePrice;
    if (sellingPrice) item.sellingPrice = sellingPrice;
    if (packageSize) item.packageSize = packageSize;
    if (stock) item.stock = stock;
    if (tax) item.tax = tax;
    if (currency) item.currency = currency;
    if (status) item.status = status;

    if (changesMade) {
      const newActivityLog = {
        action: "edited",
        quantity: stock || item.stock,
        user: userId,
      };

      item.activityLogs.push(newActivityLog);
    }
    const updatedItem = await item.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    return next(new HttpError("Failed to update the item", 400));
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findByIdAndDelete(itemId);
    if (!item) {
      return next(new HttpError("Item not found", 422));
    }

    res.status(200).json({ message: "the item has been deleted" });
  } catch (error) {
    return next(new HttpError("Failed to delete the item", 400));
  }
};

const getCategoryItem = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const items = await Item.find({ category: categoryId }).populate(
      "category"
    );
    res.json(items);
  } catch (error) {
    return next(new HttpError("Failed to get items by categories", 400));
  }
};

const getStoreItem = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const items = await Item.find({ store: storeId }).populate("store");
    res.json(items);
  } catch (error) {
    return next(new HttpError("Failed to get items by stores", 400));
  }
};

const getSupplierItem = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const items = await Item.find({ supplier: supplierId }).populate(
      "supplier"
    );
    res.json(items);
  } catch (error) {
    return next(new HttpError("Failed to get items by supplier", 400));
  }
};

const getItemsCount = async (req, res, next) => {
  try {
    const count = await Item.countDocuments();
    res.json({ count });
  } catch (error) {
    return next(new HttpError("Failed tp get the count of orders", 400));
  }
};

module.exports = {
  addProduct,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getCategoryItem,
  getSupplierItem,
  getStoreItem,
  getItemsCount,
};
