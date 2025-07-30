const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const User = require("../models/user");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use raw body for Stripe webhook verification
router.post(
  "/payment/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const membershipType = session.metadata.membershipType;

      try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        user.isPremium = true;
        user.membershipType = membershipType;
        await user.save();

        console.log(`✅ User ${user.emailId} upgraded to ${membershipType}`);
      } catch (err) {
        console.error("❌ Failed to update user premium status:", err.message);
      }
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;
