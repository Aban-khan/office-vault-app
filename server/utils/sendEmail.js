const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter (Using Gmail or generic SMTP)
  // For testing, you can just log the message to console if email fails
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use 'host: "smtp.mailtrap.io"'
    auth: {
      user: process.env.EMAIL_USER, // Set these in .env later
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define Email Options
  const mailOptions = {
    from: '"Office Vault Security" <noreply@officevault.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Send Email
  try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
  } catch (error) {
      console.log("Email service not configured. HERE IS THE LINK:");
      console.log(options.message); // <--- LOGS LINK TO TERMINAL FOR TESTING
  }
};

module.exports = sendEmail;