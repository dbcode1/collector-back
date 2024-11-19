const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB CONNECTION ERROR: ", err));

app.get("/", (req, res) => {
  res.send("hello world");
});

// import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const artRoutes = require("./routes/art");
//const cardRoutes = require("./routes/art");
const collectionsRoutes = require("./routes/collections");

// app middlewares
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", artRoutes);
//app.use("/api", cardRoutes);
app.use("/api", collectionsRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});
