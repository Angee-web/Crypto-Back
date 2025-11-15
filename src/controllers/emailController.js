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
