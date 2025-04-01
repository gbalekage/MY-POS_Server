const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;
const User = require("../models/user");
const HttpError = require("../models/error");
const Order = require("../models/order");
const Item = require("../models/item");
const Store = require("../models/store");
const Company = require("../models/category");

const PRINTER_IP = "192.168.1.87"; // Adresse fixe de l'imprimante

async function printItemsForStore(storeId, items, order, attendantName) {
  try {
    const store = await Store.findById(storeId).populate("printer");
    if (!store || !store.printer) {
      console.error(`Aucune imprimante définie pour le store: ${storeId}`);
      return;
    }

    console.log("User", attendantName);

    const printerIP = store.printer.ipAddress;
    if (!printerIP) {
      console.error(
        `Aucune adresse IP trouvée pour l'imprimante du store: ${storeId}`
      );
      return;
    }

    const printer = new ThermalPrinter({
      type: Types.EPSON,
      interface: `tcp://${printerIP}:9100`,
    });

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.error(`Imprimante ${store.name} non connectée !`);
      return;
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println(`🛒 ${store.name.toUpperCase()} STORE 🛒`);
    printer.bold(false);
    printer.drawLine();
    printer.println(`Serveur: ${attendantName}`);
    printer.drawLine();

    printer.alignLeft();
    items.forEach((item) => {
      printer.println(`${item.quantity}x ${item.productName}`);
    });

    printer.drawLine();
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error(
      `Erreur d'impression pour le store ${storeId}: ${error.message}`
    );
  }
}

async function printOrder(order, attendantName) {
  const storeItems = {};

  for (let item of order.items) {
    const product = await Item.findById(item.product).populate("store");
    if (!product || !product.store) continue;

    const storeId = product.store._id.toString();
    if (!storeItems[storeId]) {
      storeItems[storeId] = [];
    }

    storeItems[storeId].push({
      quantity: item.quantity,
      productName: product.name,
    });
  }

  for (const [storeId, items] of Object.entries(storeItems)) {
    await printItemsForStore(storeId, items, order, attendantName);
  }
}

async function printRemovedItemsForStore(storeId, removedItems, attendantName) {
  try {
    const store = await Store.findById(storeId).populate("printer");
    if (!store || !store.printer) {
      console.error(`Aucune imprimante définie pour le store: ${storeId}`);
      return;
    }

    const printerIP = store.printer.ipAddress;
    if (!printerIP) {
      console.error(
        `Aucune adresse IP trouvée pour l'imprimante du store: ${storeId}`
      );
      return;
    }

    const printer = new ThermalPrinter({
      type: Types.EPSON,
      interface: `tcp://${printerIP}:9100`,
    });

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.error(`Imprimante ${store.name} non connectée !`);
      return;
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println(
      `🛒 ${store.name.toUpperCase()} STORE (ARTICLE RETIRES) 🛒`
    );

    printer.alignLeft();
    removedItems.forEach((item) => {
      printer.println(`${item.quantity}x ${item.productName}`);
    });

    printer.drawLine();
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error(
      `Erreur d'impression des articles retirés pour le store ${storeId}: ${error.message}`
    );
  }
}

async function printRemovedItems(order, attendantName) {
  const removedItemsByStore = {};
  for (const removedItem of order.removedItems) {
    const product = await Item.findById(removedItem.product).populate("store");
    if (!product || !product.store) continue;

    const storeId = product.store._id.toString();
    if (!removedItemsByStore[storeId]) {
      removedItemsByStore[storeId] = [];
    }

    removedItemsByStore[storeId].push({
      quantity: removedItem.quantity,
      productName: product.name,
    });
  }

  for (const [storeId, removed] of Object.entries(removedItemsByStore)) {
    await printRemovedItemsForStore(storeId, removed, attendantName);
  }
}

const printInvoice = async (order) => {
  try {
    const company = await Company.findOne(); // Fetch company details
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    const printer = new ThermalPrinter({
      type: Types.EPSON,
      interface: `tcp://${printerIP}:9100`, // Add your printer's IP
    });

    // Print company logo (if available)
    if (company.logo) {
      printer.println(`Logo: ${company.logo}`);
    }

    // Print company information
    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name);
    printer.bold(false);
    printer.println(company.address);
    printer.drawLine();

    // Print order details (e.g., items, total price, etc.)
    printer.alignLeft();
    order.items.forEach((item) => {
      printer.println(`${item.quantity}x ${item.product.name}`);
    });

    printer.drawLine();
    printer.println(`Total: ${order.totalPrice} USD`);
    printer.cut();
    await printer.execute();

    return true;
  } catch (error) {
    console.error("Erreur lors de l'impression de la facture:", error);
    return false;
  }
};

module.exports = { printOrder, printRemovedItems, printInvoice };
