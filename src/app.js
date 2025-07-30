require("dotenv").config();
require("./utils/cronjob");
const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");

const app = express();

// CORS
app.use(
  cors({
    origin: "https://dev-connect-frontend-ten.vercel.app",
    credentials: true,
  })
);
const stripeWebhookRouter = require("./routes/stripeWebhook");
app.use("/", stripeWebhookRouter);

app.use(express.json());
app.use(cookieParser());

// Routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");

const paymentRoutes = require("./routes/payment");
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chat");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

app.use("/", paymentRoutes);
app.use("/", chatRouter);

const server = http.createServer(app);
initializeSocket(server);

// Connect DB and Start Server
connectDB()
  .then(() => {
    console.log("Database connection established ...");

    const PORT = process.env.PORT;
    server.listen(PORT, () => {
      console.log(`Server is successfully listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });
