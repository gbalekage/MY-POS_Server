const HttpError = require("../models/error");

const admin = (req, res, next) => {
  if (!req.user) {
    return next(new HttpError("Utilisateur non authentifié.", 401));
  }

  if (!["admin"].includes(req.user.role)) {
    return next(
      new HttpError(
        "Accès refusé. Seuls les administrateurs peuvent effectuer cette action.",
        403
      )
    );
  }
  next();
};

module.exports = admin;
