const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;
const User = require("../models/user");
const HttpError = require("../models/error");
const Order = require("../models/order");
const Item = require("../models/item");
const Store = require("../models/store");
const Company = require("../models/company");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PRINTER_IP = "192.168.1.87"; // Adresse fixe de l'imprimante
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // Génère un nombre aléatoire à 4 chiffres
  return `${year}${month}${day}-${randomNumber}`;
};

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
    printer.println(`ARTICLE RETIRES)`);
    printer.drawLine();

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
    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    const printer = new ThermalPrinter({
      type: Types.EPSON,
      interface: `tcp://${PRINTER_IP}:9100`,
    });

    const invoiceNumber = generateInvoiceNumber();

    // Print company logo (if available and exists)
    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../uploads/logos/",
        path.basename(company.logo)
      );
      console.log("Chemin du logo:", logoPath);

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../uploads/logos/resized-logo.png"
        );
        await sharp(logoPath).resize({ width: 300 }).toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
        printer.alignCenter();
        await printer.printImage(resizedLogoPath);
        printer.newLine();
      } else {
        console.error("Logo introuvable à cet emplacement:", logoPath);
      }
    } else {
      console.warn("Aucun logo défini pour l'entreprise.");
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name);
    printer.println(company.email);
    printer.drawLine();

    printer.alignCenter();
    printer.bold(true);
    printer.println(`Facture: ${invoiceNumber}`);
    printer.drawLine();

    // Table Header
    printer.alignLeft();
    printer.bold(true);
    printer.println(" Article         PU       Qty           Total");
    printer.println("------------------------------------------------");
    printer.bold(false);

    // Table Body
    order.items.forEach((item) => {
      const name = item.product.name.padEnd(14);
      const unitPrice = item.product.sellingPrice;
      const quantity = item.quantity.toString().padStart(5);
      const totalItemPrice = item.quantity * item.product.sellingPrice;

      printer.println(
        ` ${name}  ${unitPrice}  ${quantity}           ${totalItemPrice} `
      );
    });

    printer.println("------------------------------------------------");
    printer.bold(true);
    printer.println(`Total: ${order.totalPrice}/.`);
    printer.bold(false);
    printer.cut();
    await printer.execute();

    return true;
  } catch (error) {
    console.error("Erreur lors de l'impression de la facture:", error);
    return false;
  }
};

module.exports = { printOrder, printRemovedItems, printInvoice };
