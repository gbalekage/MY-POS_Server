const Order = require("../models/order");
const Item = require("../models/item");
const Table = require("../models/table");
const HttpError = require("../models/error");
const { printOrder, printNewItems } = require("../utils/print");

const createOrder = async (req, res, next) => {
  try {
    const { table, items } = req.body;
    const attendant = req.user._id;

    if (!table || !items || items.length === 0) {
      return next(
        new HttpError(
          "Veuillez sélectionner une table et ajouter des articles",
          422
        )
      );
    }

    const tableExists = await Table.findById(table);
    if (!tableExists) {
      return next(new HttpError("Table non trouvée", 422));
    }

    let totalPrice = 0;
    const formatedItems = [];

    for (const item of items) {
      const product = await Item.findById(item.product);
      if (!product) {
        return next(new HttpError("Produit non trouvé", 422));
      }
      if (typeof product.sellingPrice !== "number") {
        return next(
          new HttpError(`Prix invalide pour le produit: ${product.name}`)
        );
      }
      if (product.stock < item.quantity) {
        return next(
          new HttpError(
            `Stock insuffisant pour le produit: ${product.name}`,
            400
          )
        );
      }

      totalPrice += product.sellingPrice * item.quantity;

      // Réduction du stock
      product.stock -= item.quantity;

      // Ajout aux logs d'activité
      product.activityLogs.push({
        action: "sold",
        quantity: item.quantity,
        user: attendant,
      });

      await product.save();

      formatedItems.push({
        product: product._id,
        quantity: item.quantity,
        status: "pending",
      });
    }

    if (isNaN(totalPrice) || totalPrice <= 0) {
      return next(new HttpError("Erreur de calcul du totalPrice", 400));
    }

    const newOrder = new Order({
      table,
      attendant,
      items: formatedItems,
      totalPrice,
      status: "pending",
    });

    await newOrder.save();

    tableExists.order = newOrder._id;
    tableExists.attendent = attendant;
    tableExists.status = "occupe";
    await tableExists.save();

    await printOrder(newOrder);

    res
      .status(201)
      .json({ message: "Commande créée avec succès", order: newOrder });
  } catch (error) {
    console.log(error);
    // return next(new HttpError("Échec de la création de la commande", 400));
  }
};

const addItemToOrder = async (req, res, next) => {
  try {
    const { orderId, items } = req.body;
    const attendant = req.user._id;

    if (!orderId || !items || items.length === 0) {
      return next(
        new HttpError("Veuillez fournir une commande et des articles", 422)
      );
    }

    // Vérifier si la commande existe
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return next(new HttpError("Commande non trouvée", 404));
    }

    let totalPriceIncrement = 0;
    const newItems = [];

    for (const item of items) {
      const product = await Item.findById(item.product);
      if (!product) {
        return next(new HttpError(`Produit non trouvé`, 422));
      }
      if (typeof product.sellingPrice !== "number") {
        return next(
          new HttpError(`Prix invalide pour le produit: ${product.name}`)
        );
      }
      if (product.stock < item.quantity) {
        return next(
          new HttpError(
            `Stock insuffisant pour le produit: ${product.name}`,
            400
          )
        );
      }

      totalPriceIncrement += product.sellingPrice * item.quantity;

      // Réduction du stock
      product.stock -= item.quantity;

      // Ajouter aux logs d'activité
      product.activityLogs.push({
        action: "sold",
        quantity: item.quantity,
        user: attendant,
      });

      await product.save();

      newItems.push({
        product: product._id,
        quantity: item.quantity,
        status: "pending",
      });
    }

    if (isNaN(totalPriceIncrement) || totalPriceIncrement <= 0) {
      return next(new HttpError("Erreur de calcul du total", 400));
    }

    // Ajouter les nouveaux articles à la commande existante
    order.items.push(...newItems);
    order.totalPrice += totalPriceIncrement;

    await order.save();

    await printNewItems(order._id, newItems);

    res.status(200).json({
      message: "Articles ajoutés à la commande avec succès",
      order,
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Erreur lors de l'ajout des articles", 500));
  }
};

module.exports = { createOrder, addItemToOrder };
