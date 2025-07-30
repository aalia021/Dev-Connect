const express = require("express");
const Stripe = require("stripe");
const paymentRouter = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { userAuth } = require("../middlewares/auth");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  const { membershipType } = req.body;
  const { emailId, _id: userId } = req.user;

  const membershipAmount = {
    silver: 10000, // 100 AED (in fils)
    gold: 20000, // 200 AED (in fils)
  };

  if (!membershipAmount[membershipType]) {
    return res.status(400).json({ msg: "Invalid membership type" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: emailId,
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `${membershipType} Membership`,
            },
            unit_amount: membershipAmount[membershipType],
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        membershipType,
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ msg: "Payment session creation failed" });
  }
});
paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user.toJSON();
  console.log(user);
  if (user.isPremium) {
    return res.json({ ...user });
  }
  return res.json({ ...user });
});

module.exports = paymentRouter;
