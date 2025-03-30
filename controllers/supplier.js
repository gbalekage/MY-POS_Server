const Supplier = require("../models/supplier");
const HttpError = require("../models/error");

const addSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, contactPerson, address } = req.body;
    if (!name || !email || !phone || !contactPerson || !address) {
      return next(new HttpError("All fields are required", 400));
    }
    const supplier = new Supplier({
      name,
      email,
      phone,
      contactPerson,
      address,
    });
    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    console.error(error);
    return next(new HttpError("Failed adding the supplier", 500));
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    console.error(error);
    return next(new HttpError("Failed fetching suppliers", 500));
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return next(new HttpError("Supplier not found", 404));
    }
    res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    return next(new HttpError("Failed fetching the supplier", 500));
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, contactPerson, address } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(id);
    if (!supplier) {
      return next(new HttpError("Supplier not found", 404));
    }

    if (name) supplier.name = name;
    if (email) supplier.email = email;
    if (phone) supplier.phone = phone;
    if (contactPerson) supplier.contactPerson = contactPerson;
    if (address) supplier.address = address;

    const updatedSupplier = await supplier.save();
    if (!updatedSupplier) {
      return next(new HttpError("Failed updating the supplier", 400));
    }

    res.status(200).json(updatedSupplier);
  } catch (error) {
    console.error(error);
    return next(new HttpError("Failed updating the supplier", 500));
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return next(new HttpError("Supplier not found", 404));
    }
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Failed deleting the supplier", 500));
  }
};

module.exports = {
  addSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};
