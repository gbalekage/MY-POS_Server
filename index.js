const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const upload = require("express-fileupload");

// import files
const userRoutes = require("./routes/user");
const { notFound, errorHandler } = require("./middlewares/error");
const categoryRoutes = require("./routes/category");

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(upload());
app.use("/uploads", express.static(__dirname + "uploads"));

// routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);

//error handling
app.use(notFound);
app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Database connected");
  app.listen(port, () => console.log(`Server running on port: ${port}`));
});
