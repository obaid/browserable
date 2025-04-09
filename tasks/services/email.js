const nodemailer = require("nodemailer");

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function sendEmail({ email, subject, html, text }) {
    let info = await transporter.sendMail({
        from: `"Support" <${process.env.SMTP_FROM}>`, // sender address
        to: email, // list of receivers
        subject,
        html,
        text,
    });
    console.log("Message sent: %s", info.messageId);
}

module.exports = {
    sendEmail,
};
