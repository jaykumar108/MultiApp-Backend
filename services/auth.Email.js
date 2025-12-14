import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables

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

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Professional HTML template
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2d3748; color: #fff; padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">${process.env.FROM_NAME}</h1>
        </div>
        <div style="padding: 32px 32px 24px 32px; background: #fafafa; color: #333;">
          <p style="font-size: 1.1rem; line-height: 1.6; margin: 0;">${text || ''}</p>
        </div>
        <div style="background: #f1f1f1; color: #888; padding: 16px 32px; text-align: center; font-size: 0.95rem;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${process.env.FROM_NAME}. All rights reserved.</p>
        </div>
      </div>
    `;
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html: html || defaultHtml
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

export default sendEmail;
