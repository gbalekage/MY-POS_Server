const HttpError = require("../models/error");

const manager = (req, res, next) => {
  if (!req.user) {
    return next(new HttpError("Utilisateur non authentifié.", 401));
  }

  if (!["manager"].includes(req.user.role)) {
    return next(
      new HttpError(
        "Accès refusé. Seuls les managers peuvent effectuer cette action.",
        403
      )
    );
  }
  next();
};

module.exports = manager;
