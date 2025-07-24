const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use TLS (false for port 587)
  auth: {
    user: process.env.SMTP_USER, // Brevo SMTP user
    pass: process.env.SMTP_PASS // Brevo SMTP password
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: `"MultiApp" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text
    });
    console.log("Email sent to", to);
  } catch (error) {

    console.error("Failed to send email:", error.message);
    
    if (error.code === 'EAUTH') {
      throw new Error("Invalid SMTP credentials. Please check your Brevo API key and email.");
    } else if (error.code === 'ECONNECTION') {
      throw new Error("Failed to connect to Brevo SMTP server. Please check your internet connection.");
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
};

module.exports = sendEmail;
