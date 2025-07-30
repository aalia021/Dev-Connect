const express = require("express");
const sendEmail = require("../utils/sendEmail");
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

// 1. Send a connection request
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Invalid status type: " + status,
        });
      }

      if (fromUserId.toString() === toUserId) {
        return res
          .status(400)
          .json({ message: "You cannot connect with yourself" });
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check for existing request (either direction)
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res.status(400).json({
          message: `A request already exists between ${req.user.firstName} and ${toUser.firstName}`,
        });
      }

      const newRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await newRequest.save();

      if (status === "interested") {
        console.log("Sending email to:", toUser.emailId);
        await sendEmail(
          toUser.emailId,
          `👋 New Connection Request from ${req.user.firstName}`,
          `<p>Hi ${toUser.firstName},</p>
     <p><strong>${req.user.firstName} ${req.user.lastName}</strong> just sent you a connection request on <strong>DevConnect</strong>.</p>
     <p><a href="https://dev-connect-frontend.vercel.app/requests">👉 View Your Requests</a></p>
     <br>
     <p>Regards,<br>DevConnect Team</p>`
        );
      }
      res.status(201).json({
        message: "Connection request sent successfully",
        data,
      });
    } catch (err) {
      console.error("Send Request Error:", err);
      res.status(500).json({ message: "Error: " + err.message });
    }
  }
);

// 2. Review (accept/reject) a connection request
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedUser = req.user;
      const { status, requestId } = req.params;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Status not allowed!" });
      }

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedUser._id,
        status: "interested", // only pending ones can be reviewed
      });

      if (!connectionRequest) {
        return res.status(404).json({
          message: "Connection request not found or already reviewed",
        });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({
        message: `Connection request ${status}`,
        data,
      });
    } catch (err) {
      console.error("Review Request Error:", err);
      res.status(500).json({ message: "Error: " + err.message });
    }
  }
);

module.exports = requestRouter;
