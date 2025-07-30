const cron = require("node-cron");
const { subHours } = require("date-fns");
const ConnectionRequestModel = require("../models/connectionRequest");
const sendEmail = require("./sendEmail");

cron.schedule("0 8 * * *", async () => {
  console.log("🕗 Running daily reminder email cron job...");

  try {
    const last24Hours = subHours(new Date(), 24);
    console.log(
      "⏱ Looking for requests created after:",
      last24Hours.toISOString()
    );

    const pendingRequests = await ConnectionRequestModel.find({
      status: "interested",
      createdAt: { $gte: last24Hours },
    }).populate("fromUserId toUserId");

    console.log(`🔍 Found ${pendingRequests.length} pending request(s)`);

    const toUserMap = {};

    for (const req of pendingRequests) {
      const toEmail = req.toUserId.emailId;
      if (!toEmail) continue;

      if (!toUserMap[toEmail]) {
        toUserMap[toEmail] = [];
      }
      toUserMap[toEmail].push(
        `${req.fromUserId.firstName} ${req.fromUserId.lastName}`
      );
    }

    for (const [email, fromUsers] of Object.entries(toUserMap)) {
      const namesList = fromUsers.map((name) => `<li>${name}</li>`).join("");

      const html = `
        <p>Hi there,</p>
        <p>You have new connection requests on <strong>DevConnect</strong> from:</p>
        <ul>${namesList}</ul>
        <p><a href="https://dev-connect-frontend.vercel.app/requests">👉 View Your Requests</a></p>
        <br>
        <p>Regards,<br>DevConnect Team</p>
      `;

      await sendEmail(
        email,
        "⏰ Reminder: You have pending connection requests",
        html
      );

      console.log(`✅ Reminder sent to ${email}`);
    }
  } catch (err) {
    console.error("❌ Error in daily reminder cron job:", err.message);
  }
});
