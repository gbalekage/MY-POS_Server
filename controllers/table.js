const Table = require("../models/table");
const HttpError = require("../models/error");

const addTables = async (req, res, next) => {
  try {
    const { numberOfTables } = req.body;

    if (!numberOfTables || isNaN(numberOfTables) || numberOfTables <= 0) {
      return next(new HttpError("Please add the number of tables", 422));
    }

    const tables = [];

    for (let i = 1; i <= numberOfTables; i++) {
      tables.push({
        number: i,
        status: "disponible",
      });
    }

    await Table.insertMany(tables);

    res.status(201).json(`${numberOfTables} tables was created`);
  } catch (error) {
    console.log("Error:", error);
    return next(new HttpError("Failed to create the tables", 400));
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find();
    res.status(200).json(tables);
  } catch (error) {
    return next(new HttpError("Failed to get the tables", 400));
  }
};

const getTableById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const table = await Table.findById(id);
    if (!table) {
      return next(new HttpError("Table not found", 422));
    }

    res.status(200).json(table);
  } catch (error) {
    return next(new HttpError("Failed to get the table", 400));
  }
};

const getUserTable = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const tables = await Table.find({ attendent: userId });
    if (!tables) {
      return next(new HttpError("No table found for the user", 422));
    }

    res.status(200).json(tables);
  } catch (error) {
    return next(new HttpError("Failed to get the users tables", 422));
  }
};

const getOrderTable = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const table = await Table.findOne({ order: orderId });
    if (!table) {
      return next(new HttpError("No table found with that order", 422));
    }
    res.status(200).json(table);
  } catch (error) {
    return next(new HttpError("Failed to get the table by order", 400));
  }
};

module.exports = {
  addTables,
  getTables,
  getTableById,
  getUserTable,
  getOrderTable,
};
