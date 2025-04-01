const Order = require("../models/order");
const Item = require("../models/item");
const User = require("../models/user");
const Table = require("../models/table");
const HttpError = require("../models/error");
const {
  printOrder,
  printRemovedItems,
  printInvoice,
} = require("../utils/print");

const createOrder = async (req, res, next) => {
  try {
    const { table, items } = req.body;
    const attendant = req.user._id;

    if (!table || !items || items.length === 0) {
      return next(new HttpError(`Table et items sont requis.`, 400));
    }

    const tableExists = await Table.findById(table);
    if (!tableExists) {
      return next(new HttpError(`Table non trouvée.`, 404));
    }

    const productIds = items.map((i) => i.product);
    const products = await Item.find({ _id: { $in: productIds } }).populate(
      "store"
    );

    if (products.length !== items.length) {
      return next(
        new HttpError(`Un ou plusieurs produits sont introuvables.`, 404)
      );
    }

    let totalPrice = 0;
    const formattedItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product || typeof product.sellingPrice !== "number") {
        return next(
          new HttpError(
            `Prix invalide ou produit non trouvé: ${item.product}`,
            400
          )
        );
      }

      totalPrice += product.sellingPrice * item.quantity;
      return {
        product: product._id,
        quantity: item.quantity,
        status: "pending",
        printed: false,
      };
    });

    if (isNaN(totalPrice) || totalPrice <= 0) {
      return next(new HttpError(`Erreur de calcul du totalPrice`, 404));
    }

    const newOrder = new Order({
      table,
      attendant,
      items: formattedItems,
      totalPrice,
      status: "pending",
    });

    await newOrder.save();

    tableExists.order = newOrder._id;
    tableExists.attendent = attendant;
    tableExists.status = "occupe";
    await tableExists.save();

    for (const item of formattedItems) {
      const product = await Item.findById(item.product);
      if (product) {
        product.stock -= item.quantity;

        product.activityLogs.push({
          action: "sold",
          quantity: item.quantity,
          user: attendant,
        });

        await product.save();
      }
    }

    const user = await User.findById(attendant);
    if (user) {
      if (!user.assignedTables.includes(table)) {
        user.assignedTables.push(table);
      }

      user.activityLogs.push({
        action: "order_created",
        description: `Commande ${newOrder._id} créée pour la table ${table}`,
      });

      await user.save();
    }

    const attendantName = req.user.name || "Inconnu";
    await printOrder(newOrder, attendantName);

    res
      .status(201)
      .json({ message: "Commande créée avec succès", order: newOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addItemToOrder = async (req, res, next) => {
  try {
    const { table, items } = req.body;
    const attendant = req.user._id;

    if (!table || !items || items.length === 0) {
      return next(new HttpError("Table et items sont requis.", 400));
    }

    const tableExists = await Table.findById(table);
    if (!tableExists) {
      return next(new HttpError("Table non trouvée.", 404));
    }

    const existingOrder = await Order.findById(tableExists.order);
    if (!existingOrder) {
      return next(
        new HttpError("Aucune commande en cours pour cette table.", 404)
      );
    }

    let additionalPrice = 0;
    const newItems = await Promise.all(
      items.map(async (item) => {
        const product = await Item.findById(item.product);
        if (!product) {
          return next(
            new HttpError(`Produit non trouvé: ${item.product}`, 404)
          );
        }
        if (typeof product.sellingPrice !== "number") {
          return next(
            new HttpError(`Prix invalide pour le produit: ${product._id}`, 400)
          );
        }

        additionalPrice += product.sellingPrice * item.quantity;

        return {
          product: product._id,
          quantity: item.quantity,
          status: "pending",
        };
      })
    );

    if (isNaN(additionalPrice) || additionalPrice <= 0) {
      return next(
        new HttpError(`Erreur de calcul du prix supplémentaire`, 400)
      );
    }

    existingOrder.items.push(...newItems);
    existingOrder.totalPrice += additionalPrice;

    await existingOrder.save();

    const attendantName = req.user.name || "Inconnu";
    await printOrder({ items: newItems }, attendantName);

    res.status(200).json({
      message: "Articles ajoutés avec succès à la commande",
      order: existingOrder,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeItemFromOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const itemsToRemove = req.body.items;
    const attendantName = req.user.name;

    if (!Array.isArray(itemsToRemove) || itemsToRemove.length === 0) {
      return next(
        new HttpError(`Aucun article spécifié pour la suppression`, 400)
      );
    }

    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return next(new HttpError(`Commande introuvable`, 404));
    }

    const removedItems = [];

    for (const { itemId, quantity } of itemsToRemove) {
      const itemIndex = order.items.findIndex(
        (item) => item.product._id.toString() === itemId
      );

      if (itemIndex !== -1) {
        const itemToRemove = order.items[itemIndex];

        if (itemToRemove.quantity < quantity) {
          return next(
            new HttpError(
              `Quantité demandée pour l'article ${itemToRemove.product.name} est supérieure à celle dans la commande.`,
              400
            )
          );
        }

        itemToRemove.quantity -= quantity;
        if (itemToRemove.quantity === 0) {
          order.items.splice(itemIndex, 1);
        }

        removedItems.push({
          product: itemToRemove.product._id,
          quantity,
          productName: itemToRemove.product.name,
        });

        order.removedItems.push({
          product: itemToRemove.product._id,
          quantity,
        });

        const item = await Item.findById(itemToRemove.product._id);
        if (item) {
          item.stock += quantity;
          item.activityLogs.push({
            action: "restocked",
            quantity,
            user: req.user._id,
          });
          await item.save();
        }
      }
    }

    order.totalPrice = order.items.reduce(
      (total, item) => total + item.quantity * item.product.sellingPrice,
      0
    );

    await order.save();

    if (removedItems.length > 0) {
      await printRemovedItems(order, attendantName);
    }

    return res.status(200).json({
      message: "Articles supprimés avec succès",
      removedItems,
      order,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des articles:", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};

const facture = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("attendant");

    if (!order) {
      return res.status(404).json({ error: "Commande introuvable." });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    let printLimit = 0;

    if (user.role === "attendant") {
      printLimit = 1;
    } else if (user.role === "cashier") {
      printLimit = 1;
    } else if (user.role === "manager") {
      printLimit = 2;
    } else if (user.role === "admin") {
      printLimit = 4;
    }

    if (user.billPrintCount >= printLimit) {
      return res.status(403).json({
        error: `Vous avez atteint votre limite de ${printLimit} impression(s) de facture.`,
      });
    }

    const success = await printInvoice(order);
    if (!success) {
      return res.status(500).json({ error: "Erreur d'impression." });
    }

    user.billPrintCount += 1;
    await user.save();

    order.status = "bill-printed";
    await order.save();

    res.status(200).json({ message: "Facture imprimée avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

module.exports = { createOrder, addItemToOrder, removeItemFromOrder, facture };
