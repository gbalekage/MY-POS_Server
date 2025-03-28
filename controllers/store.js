const Store = require("../models/store");
const HttpError = require("../models/error");
const Printer = require("../models/printer");

const addStore = async (req, res, next) => {
  try {
    const { name, printer } = req.body;

    if (!name || !printer) {
      return next(new HttpError("Remplissez tous les champs", 422));
    }

    const existingPrinter = await Printer.findById(printer);
    if (!existingPrinter) {
      return next(new HttpError("Aucune imprimante trouvée", 404));
    }

    const existingStore = await Store.findOne({ name });
    if (existingStore) {
      return next(new HttpError("Un store avec ce nom existe déjà", 422));
    }

    const newStore = await Store.create({ name, printer: existingPrinter._id });

    res.status(201).json(newStore);
  } catch (error) {
    return next(new HttpError("Échec de l'ajout du store", 500));
  }
};

const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    return next(new HttpError("Failed to get the stores", 400));
  }
};

const getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);
    if (!store) {
      return next(new HttpError("Store not found", 422));
    }
    res.status(200).json(store);
  } catch (error) {
    return next(new HttpError("Failed to get the store", 400));
  }
};

const updateStore = async (req, res, next) => {
  try {
    const { name, printer } = req.body;
    const { id } = req.params;
    const store = await Store.findById(id);
    if (!store) {
      return next(new HttpError("Store not found", 422));
    }

    if (name) store.name = name;
    if (printer) store.printer = printer;

    const updatedStore = await store.save();
    res.status(200).json(updatedStore);
  } catch (error) {
    console.log(error);
    return next(new HttpError("Failed to update the Store", 400));
  }
};

const deleteStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return next(new HttpError("The Store is not found", 404));
    }
    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    return next(new HttpError("Failed to delete the Store", 400));
  }
};

module.exports = {
  addStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
};
