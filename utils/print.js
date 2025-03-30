const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;
const User = require("../models/user");
const HttpError = require("../models/error");
const Order = require("../models/order");

const printOrder = async (order) => {
  try {
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: "items.product",
        populate: { path: "store", populate: { path: "printer" } },
      })
      .populate("table");

    if (!populatedOrder) {
      console.error("Commande non trouvée !");
      return;
    }

    const attendant = await User.findById(populatedOrder.attendant).select(
      "name"
    );
    const formattedDate = new Date(populatedOrder.createdAt).toLocaleString(
      "fr-FR"
    );

    const printJobs = {};

    populatedOrder.items.forEach((item) => {
      const store = item.product.store;
      const printer = store?.printer;

      if (!printer || !printer.ipAddress) {
        console.error(
          `Aucune imprimante assignée pour le magasin ${store?.name}`
        );
        return;
      }

      if (!printJobs[printer.ipAddress]) {
        printJobs[printer.ipAddress] = [];
      }

      printJobs[printer.ipAddress].push({
        name: item.product.name,
        quantity: item.quantity,
        store: store.name,
      });
    });

    // Envoyer chaque lot d'articles à son imprimante
    for (const ip in printJobs) {
      const printer = new ThermalPrinter({
        type: Types.EPSON, // ou STAR selon votre imprimante
        interface: `tcp://${ip}:9100`,
        removeSpecialCharacters: false,
        lineCharacter: "-",
        width: 42,
      });

      printer.bold(true);
      printer.println("RESTAURANT/BAR");
      printer.println("Commande: " + populatedOrder._id.toString().slice(-6));
      printer.bold(false);
      printer.println("Date : " + formattedDate);
      printer.newLine();

      printer.println("Serveur: " + (attendant ? attendant.name : "Inconnu"));
      printer.drawLine();

      printer.bold(true);
      printer.println("Articles :");

      printJobs[ip].forEach((item, index) => {
        printer.println(`${item.name} x${item.quantity}`);
      });

      printer.drawLine();
      printer.newLine();

      printer.println("Merci pour votre visite !");
      printer.cut();

      const success = await printer.execute();
      if (!success) {
        console.error(`Erreur d'impression sur ${ip} !`);
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'impression :", error);
  }
};

module.exports = printOrder;
