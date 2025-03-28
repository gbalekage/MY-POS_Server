const HttpError = require("../models/error");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const register = async (req, res, next) => {
  try {
    const { name, email, username, pin, phone, address, role, pin2 } = req.body;

    // Vérification des champs obligatoires
    if (!name || !email || !username || !pin || !phone || !address || !role) {
      return next(new HttpError("Veuillez remplir tous les champs.", 422));
    }

    // Vérification du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new HttpError("Adresse email invalide.", 422));
    }

    // Normalisation des entrées
    const newUsername = username.toLowerCase().trim();
    const newEmail = email.toLowerCase().trim();

    // Vérifier si un utilisateur avec le même email existe déjà
    const existingEmailUser = await User.findOne({ email: newEmail });
    if (existingEmailUser) {
      return next(new HttpError("Cet email est déjà utilisé.", 422));
    }

    // Vérifier si un utilisateur avec le même username existe
    const existingUser = await User.findOne({ username: newUsername });

    // Si un utilisateur supprimé existe avec le même username, on le restaure
    if (existingUser) {
      if (existingUser.isDeleted) {
        existingUser.isDeleted = false;
        existingUser.name = name;
        existingUser.email = newEmail;
        existingUser.phone = phone;
        existingUser.address = address;
        existingUser.role = role;
        existingUser.status = "active";
        await existingUser.save();

        return res.status(200).json({
          message: "Utilisateur restauré avec succès.",
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            username: existingUser.username,
            role: existingUser.role,
            status: existingUser.status,
          },
        });
      }
      return next(new HttpError("Le nom d'utilisateur est déjà pris.", 422));
    }

    if (pin.trim().length !== 4 || isNaN(pin)) {
      return next(
        new HttpError("Le code PIN doit contenir exactement 4 chiffres.", 422)
      );
    }

    if (pin !== pin2) {
      return next(new HttpError("Les codes PIN ne correspondent pas.", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    const newUser = await User.create({
      name,
      email: newEmail,
      username: newUsername,
      pin: hashedPin,
      phone,
      address,
      role,
      status: "active",
    });

    res.status(201).json({
      message: "Utilisateur enregistré avec succès.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    return next(
      new HttpError("L'enregistrement de l'utilisateur a échoué.", 500)
    );
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return next(new HttpError("fill in all fields", 422));
    }

    const newUsername = username.toLowerCase();

    const user = await User.findOne({ username: newUsername });
    if (!user) {
      return next(new HttpError("User not found, invalid credentials", 404));
    }

    const dbPin = await bcrypt.compare(pin, user.pin);
    if (!dbPin) {
      return next(
        new HttpError("The pin is incorrect, please verify and try again", 400)
      );
    }

    const { _id: id, name, role, status } = user;
    const token = jwt.sign({ id, name, role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    user.lastLogin = Date.now();
    user.loginHistory.push({
      ip: req.ip || "Inconnu",
      userAgent: req.headers["user-agent"] || "Inconnu",
      date: new Date(),
    });
    await user.save();

    res.status(200).json({ token, id, name });
  } catch (error) {
    return next(new HttpError("Failed logiging in the user", 400));
  }
};

const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-pin");
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    res.status(200).json(user);
  } catch (error) {
    return next(
      new HttpError("Failed to get the user please try again in a moment", 400)
    );
  }
};

const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-pin");
    res.json(authors);
  } catch (error) {
    return next(new HttpError("Failed to get users, try again later", 400));
  }
};

const avatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return next(new HttpError("Please upload an image", 400));
    }

    const avatar = req.files.avatar; // Ensure avatar is properly assigned
    if (avatar.size > 5 * 1024 * 1024) {
      return next(new HttpError("The image size is too large", 400));
    }

    const user = await User.findById(req.user.id);
    if (user.avatar) {
      fs.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    const fileName = avatar.name;
    const splittedFileName = fileName.split(".");
    const newFilename =
      splittedFileName[0] +
      uuid() +
      "." +
      splittedFileName[splittedFileName.length - 1];

    avatar.mv(
      path.join(__dirname, "..", "uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError("Failed to save the avatar file", 500));
        }

        const updatedAvatar = await User.findByIdAndUpdate(
          req.user.id,
          { avatar: newFilename },
          { new: true }
        );

        if (!updatedAvatar) {
          return next(new HttpError("Failed to update the avatar", 400));
        }
        res.status(200).json(updatedAvatar);
      }
    );
  } catch (error) {
    console.error(error);
    return next(
      new HttpError("Failed adding the avatar, please try again later", 500)
    );
  }
};

const editUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      username,
      phone,
      address,
      role,
      pin,
      pin2,
      Oldpin,
      status, // Correction de isActive → status
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new HttpError("Utilisateur non trouvé", 404));
    }

    // Vérification si l'utilisateur est supprimé
    if (user.isDeleted) {
      return next(new HttpError("Cet utilisateur a été supprimé", 410));
    }

    // Mise à jour du mot de passe si fourni
    if (pin) {
      if (pin !== pin2) {
        return next(
          new HttpError("Les mots de passe ne correspondent pas", 422)
        );
      }

      const isMatch = await bcrypt.compare(Oldpin, user.pin);
      if (!isMatch) {
        return next(new HttpError("Ancien mot de passe incorrect", 422));
      }

      const salt = await bcrypt.genSalt(10);
      user.pin = await bcrypt.hash(pin, salt);
    }

    // Mise à jour des informations si fournies
    if (name) user.name = name;
    if (email) user.email = email;
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Seul un admin peut changer le rôle d'un utilisateur
    if (role && req.user.role === "admin") {
      user.role = role;
    }

    // Mise à jour du statut (active/inactive/suspended)
    if (status) {
      user.status = status;
    }

    // Ajout dans les logs d'activité
    user.activityLogs.push({
      action: "Mise à jour de l'utilisateur",
      description: `L'utilisateur ${user.username} a été mis à jour par ${req.user.username}.`,
    });

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return next(
      new HttpError(
        `Erreur lors de la mise à jour de l'utilisateur: ${error.message}`,
        500
      )
    );
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new Errors("Utilisateur non trouvé", 404));
    }

    if (user.isDeleted) {
      return next(new Errors("Cet utilisateur a déjà été supprimé", 410));
    }

    user.isDeleted = true;
    user.status = "inactive";
    user.activityLogs.push({
      action: "Suppression de l'utilisateur",
      description: `L'utilisateur ${user.username} a été supprimé par ${req.user.username}.`,
    });

    // Save the updated user document
    const deletedUser = await user.save();

    res
      .status(200)
      .json({ message: "Utilisateur supprimé avec succès", deletedUser });
  } catch (error) {
    console.error("Error deleting user:", error);
    return next(
      new Errors(
        `Erreur lors de la suppression de l'utilisateur: ${error.message}`,
        500
      )
    );
  }
};

module.exports = {
  register,
  loginUser,
  getUser,
  getAuthors,
  avatar,
  editUser,
  deleteUser,
};
