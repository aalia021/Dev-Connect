const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://aalia9209:Dolantwins2019@cluster0.hdjppeg.mongodb.net/devConnect"
  );
};

module.exports = connectDB;
