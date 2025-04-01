const Company = require("../models/company");
const HttpError = require("../models/error");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const addCompany = async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;
    if (!name || !address || !phone || !email) {
      return next(new HttpError("All fields are required", 422));
    }

    const company = await Company.findOne({ name });
    if (company) {
      return next(new HttpError("The company already exists", 422));
    }

    let logoPath = null;
    if (req.files && req.files.logo) {
      const logo = req.files.logo;
      const fileExt = path.extname(logo.name);
      const allowedExt = [".png"];

      if (!allowedExt.includes(fileExt.toLowerCase())) {
        return next(
          new HttpError("Invalid file type. Only PNG are allowed", 400)
        );
      }

      const fileName = uuid() + fileExt;
      const uploadPath = path.join(__dirname, "../uploads/logos", fileName);

      logo.mv(uploadPath, (err) => {
        if (err) {
          console.error(err);
          return next(new HttpError("Failed to upload logo", 500));
        }
      });
      logoPath = `/uploads/logos/${fileName}`;
    }

    const newCompany = await Company.create({
      name,
      address,
      phone,
      email,
      logo: logoPath,
    });

    res.status(201).json({
      message: "The company was added",
      company: {
        id: newCompany._id,
        name: newCompany.name,
        email: newCompany.email,
        logo: newCompany.logo,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Failed to add the company", 500));
  }
};

const editCompany = async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) {
      return next(new HttpError("Company not found", 404));
    }

    if (name) company.name = name;
    if (address) company.address = address;
    if (phone) company.phone = phone;
    if (email) company.email = email;

    const updatedCompany = await company.save();

    res.status(200).json(updatedCompany);
  } catch (error) {}
};

const addLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || !req.files.logo) {
      return next(new HttpError("Please upload an image", 400));
    }

    const logo = req.files.logo; // Ensure avatar is properly assigned
    if (logo.size > 5 * 1024 * 1024) {
      return next(new HttpError("The image size is too large", 400));
    }

    const company = await Company.findById(id);
    if (company.logo) {
      fs.unlink(path.join(__dirname, "..", "uploads", company.logo), (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    const fileName = logo.name;
    const splittedFileName = fileName.split(".");
    const newFilename =
      splittedFileName[0] +
      uuid() +
      "." +
      splittedFileName[splittedFileName.length - 1];

    logo.mv(path.join(__dirname, "..", "uploads", newFilename), async (err) => {
      if (err) {
        return next(new HttpError("Failed to save the avatar file", 500));
      }

      const updatedLogo = await Company.findByIdAndUpdate(
        id,
        {
          logo: newFilename,
        },
        { new: true }
      );

      if (!updatedLogo) {
        return next(new HttpError("Failed to update the avatar", 400));
      }
      res.status(200).json(updatedLogo);
    });
  } catch (error) {
    console.error(error);
    return next(
      new HttpError("Failed adding the avatar, please try again later", 500)
    );
  }
};

module.exports = { addCompany, editCompany, addLogo };
