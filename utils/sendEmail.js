const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars').default;
const path = require('path');

const sendEmail = async (
    subject,
    send_to,
    sent_from,
    reply_to,
    template,
    name,
    link
) => {
    const transporter = nodemailer.createTransport({
        host: process.env.GETLISTED_EMAIL_HOST,
        port: process.env.GETLISTED_EMAIL_PORT,
        auth: {
            user: process.env.GETLISTED_EMAIL_USER,
            pass: process.env.GETLISTED_EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const handlebarOptions = {
        viewEngine: {
            extname: '.handlebars',
            partialsDir: path.resolve('./emails'),
            defaultLayout: false,
        },
        viewPath: path.resolve('./emails'),
        extName: '.handlebars',
    };

    console.log("📧 Using email template:", template);

    transporter.use('compile', hbs(handlebarOptions));

    const options = {
        from: sent_from,
        to: send_to,
        replyTo: reply_to,
        subject: subject,
        template, // e.g., "welcome"
        context: {
            name,
            link,
        },
    };

    transporter.sendMail(options, function (err, info) {
        if (err) {
            console.log('Email sending failed:', err);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports = sendEmail;
