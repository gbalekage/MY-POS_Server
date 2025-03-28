const Printer = require("../models/printer");
const HttpError = require("../models/error");
const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;

const addPrinter = async (req, res, next) => {
  try {
    const { name, ipAddress } = req.body;

    if (!name || !ipAddress) {
      return next(new HttpError("Fill in all fields", 422));
    }

    const printer = await Printer.findOne({ ipAddress });
    if (printer) {
      return next(
        new HttpError("A printer with the given IP already exists", 422)
      );
    }

    const newPrinter = await Printer.create({
      name,
      ipAddress,
    });

    res.status(201).json(newPrinter);
  } catch (error) {
    return next(new HttpError("Failed to add the printer", 400));
  }
};

const getPrinters = async (req, res, next) => {
  try {
    const printers = await Printer.find();
    res.status(200).json(printers);
  } catch (error) {
    return next(new HttpError("Failed to get the printers"));
  }
};

const getPrinterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const printer = await Printer.findById(id);
    if (!printer) {
      return next(new HttpError("Printer not found", 404));
    }
    res.status(200).json(printer);
  } catch (error) {
    console.log("Error in get printer:", error);
    return next(new HttpError("Failed to get the printer", 400));
  }
};

const updatePrinter = async (req, res, next) => {
  try {
    const { name, ipAddress } = req.body;
    const { id } = req.params;

    const printer = await Printer.findById(id);
    if (!printer) {
      return next(new HttpError("Printer not found", 404));
    }

    if (name) printer.name = name;
    if (ipAddress) printer.ipAddress = ipAddress;

    const updatedPrinter = await printer.save();
    res.status(200).json(updatedPrinter);
  } catch (error) {
    return next(new HttpError("Failed to update the printer", 400));
  }
};

const deletePrinter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const printer = await Printer.findByIdAndDelete(id);
    if (!printer) {
      return next(new HttpError("The printer is not found", 404));
    }
    res.status(200).json({ message: "Printer deleted successfully" });
  } catch (error) {
    return next(new HttpError("Failed to delete the printer", 400));
  }
};

const testPrinter = async (req, res, next) => {
  try {
    const { ipAddress, name } = req.body;
    if (!ipAddress) {
      return next(new HttpError("Fill in all fields", 422));
    }

    let printer = new ThermalPrinter({
      type: Types.EPSON,
      interface: `tcp://${ipAddress}`,
      characterSet: "SLOVENIA",
      removeSpecialCharacters: false,
      width: 48,
    });

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return next(new HttpError("L'imprimante n'est pas connectée", 400));
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println("Test Print", name);
    printer.bold(false);
    printer.newLine();
    printer.cut();

    let execute = await printer.execute();
    if (!execute) {
      return next(new HttpError("L'impression de test a échoué", 400));
    }

    res.status(200).json({ message: "Test réussi, l'imprimante fonctionne" });
  } catch (error) {
    return next(new HttpError("Erreur lors du test de l'imprimante", 500));
  }
};

module.exports = {
  addPrinter,
  getPrinters,
  getPrinterById,
  updatePrinter,
  deletePrinter,
  testPrinter
};
