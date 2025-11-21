import nodemailer from 'nodemailer';
import { body, validationResult } from "express-validator";

// Outlook SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS requires secureConnection = false
  auth: {
    user: process.env.GMAIL_EMAIL,   // e.g. your outlook email
    pass: process.env.GMAIL_PASSWORD // your outlook password / app password
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
        from: process.env.OUTLOOK_EMAIL,
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

    } catch (error) {
      console.error("Email sending error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send email"
      });
    }
  }
];


export const sendPasswordResetConfirmationEmail = async (email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,   // e.g. your outlook email
      pass: process.env.GMAIL_PASSWORD
    },
  });

  // Use UTC format for universal consistency
  const resetDateUTC = new Date().toUTCString();

  const mailOptions = {
    from: `"CryptoMine Capital" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Password Has Been Reset",
    html: `
      <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0a0a0a;">Password Reset Successful</h2>

        <p>Hello,</p>

        <p>This is a confirmation that your <strong>CryptoMine Capital</strong> account password was successfully reset on:</p>

        <p style="padding: 10px 15px; background: #f4f4f4; border-radius: 6px; display: inline-block; font-weight: bold;">
          ${resetDateUTC} (UTC)
        </p>

        <p>If <strong>you did not request this password change</strong>, please contact our support team immediately so we can secure your account.</p>

        <p>
          <strong>Support Email:</strong>  
          <a href="mailto:cryptominecapital@gmail.com">cryptominecapital@gmail.com</a>
        </p>

        <p>Thank you for helping us keep your account safe.</p>

        <p style="margin-top: 20px;">Best regards,<br/>
        <strong>CryptoMine Capital Team</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};