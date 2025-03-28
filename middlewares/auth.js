const HttpError = require("../models/error");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new HttpError("Accès non autorisé.", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-pin");

    if (!req.user) {
      return next(new HttpError("Utilisateur non trouvé.", 401));
    }

    next();
  } catch (error) {
    return next(new HttpError("Token invalide.", 401));
  }
};

module.exports = auth;
