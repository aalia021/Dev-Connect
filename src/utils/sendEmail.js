const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "DevConnect <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      return;
    }

    console.log("Email sent successfully:", data);
  } catch (err) {
    console.error("Unexpected error sending email:", err);
  }
};

module.exports = sendEmail;
