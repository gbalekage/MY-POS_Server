const HttpError = require("../models/error");

const cashier = (req, res, next) => {
  if (!req.user) {
    return next(new HttpError("Utilisateur non authentifié.", 401));
  }

  if (!["cashier"].includes(req.user.role)) {
    return next(
      new HttpError(
        "Accès refusé. Seuls les cashier peuvent effectuer cette action.",
        403
      )
    );
  }
  next();
};

module.exports = cashier;
