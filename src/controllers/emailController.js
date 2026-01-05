import nodemailer from 'nodemailer';
import { body, validationResult } from "express-validator";

// Outlook SMTP transporter
const transporter = nodemailer.createTransport({
  // host: process.env.BREVO_HOST,
  host: "",
  // port: process.env.BREVO_PORT,
  port: 587,
  secure: false,
  // requireTLS: true,
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});

// Send email controller
export const sendEmail = [
  body("to").isEmail().withMessage("Recipient email is required"),
  body("subject").notEmpty(),
  body("message").notEmpty(),

  async (req, res) => {
    // Validate fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { to, subject, message } = req.body;

    try {
      const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to,
        subject,
        html: `
          <div style="font-family: Arial; font-size: 15px;">
            ${message}
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: "Email sent successfully"
      });

    } catch (err) {
      console.error("Nodemailer error:", err);
      res.status(500).json({ success: false, message: "Failed to send email", error: err.message });
    }
  }
];


export const sendPasswordResetConfirmationEmail = async (email) => {
  const mailOptions = {
    from: `"CryptoMine Capital" <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: "Your Password Has Been Reset",
    html: `
      <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0a0a0a;">Password Reset Successful</h2>
        <p>This is a confirmation that your CryptoMine Capital account password was reset on ${new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })}.</p>
        <p>If you did not request this, contact <a href="mailto:cryptominecapital@gmail.com">cryptominecapital@gmail.com</a> immediately.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
