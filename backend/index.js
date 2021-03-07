const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
//console.log(process.env);

const { NODE_ENV, PORT, MONGODB_URI } = process.env;
const isProd = NODE_ENV === "production";
const port = PORT || 5000;

// Set up Mongoose
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .catch((error) => {
    console.log(error);
    process.exit();
  });

mongoose.connection.once("open", () =>
  console.log("MongoDB database connection established successfully!")
);

// Set up middleware
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// API routes

app.use("/api/register", require("./routes/api/register"));
app.use("/api/login", require("./routes/api/login"));

// Handle production
if (isProd) {
  // Static folder
  app.use(express.static(__dirname + "/public"));
  // SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + "/public/index.html"));
}

app.listen(port, () => {
  console.log(`Server started in ${NODE_ENV} mode on port ${port}`);
});

module.exports = app;
