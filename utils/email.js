const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

exports.sendEmailToCandidate = async (options) => {
    let html = await fs.promises.readFile(path.join(__dirname, 'emailToCandidate.html'), 'utf-8');
    html = html.replace('[candidateName]', options.candidateName);
    html = html.replace('[position]', options.position);
    html = html.replace('[companyName]', options.companyName);
    html = html.replace('[interviewDate]', options.interviewDate);
    html = html.replace('[location]', options.location);
    html = html.replace('[deadlineConfirm]', options.deadlineConfirm);
    html = html.replace('[companyPhoneNumber]', options.companyPhoneNumber);

    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: 'andrewleedev276@gmail.com',
            pass: 'onskmmxrxizkwdqi',
        },
    });
    // 2) Define the email options
    const mailOptions = {
        from: 'JobHub - Trung tâm việc làm',
        to: options.to,
        subject: options.subject,
        // text: options.message,
        html,
    };
    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

exports.sendOtp = async (options) => {
    let html = await fs.promises.readFile(path.join(__dirname, 'confirmOtp.html'), 'utf-8');
    html = html.replace('[otp]', options.otp);

    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: 'andrewleedev276@gmail.com',
            pass: 'onskmmxrxizkwdqi',
        },
    });
    // 2) Define the email options
    const mailOptions = {
        from: 'JobHub - Trung tâm việc làm',
        to: options.to,
        subject: options.subject,
        // text: options.message,
        html,
    };
    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};
