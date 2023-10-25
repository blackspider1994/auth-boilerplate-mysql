const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
// const nodemailer = require("nodemailer");
const validator = require('validator');
const json = require("json");
const buffer = require("buffer");
const User = require("../../models/User");
const env = require('dotenv');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const moment = require('moment');
env.config();
let lastSent = null;
// Email configuration
const smtpTransport = nodemailer.createTransport({
    service: "SendinBlue",
    host: process.env.SMTP_URL, // e.g., 'gmail' for Gmail
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});
// verify connection configuration
smtpTransport.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Server is ready to take our messages");
    }
});
console.log("smtpTransport ", smtpTransport)

const senderEmail = process.env.SMTP_EMAIL;
const receiverEmails = ["harisbakhabarpk@gmail.com", "usama.sama@gmail.com", "saad.ahmed@codistan.org","haseebwindscc@gmail.com"];

// Create a function to send an email
function sendEmail(subject, body) {
    const mailOptions = {
        from: senderEmail,
        to: receiverEmails.join(', '),
        subject: subject,
        text: body,
    };

    smtpTransport.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log("info ", info)
            console.log('Email sent:', info.response);
        }
    });
}
// Create a function to check the status of URLs
async function checkBackend(url) {
    let data = JSON.stringify({
        query: `query{
        ping
      }`,
        variables: {}
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    const response = await axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
            return response
        })
        .catch((error) => {
            console.log(error);
            throw error
        });
    return response;
}
async function checkUrls(urlsToCheck) {
    const results = {};

    for (const [name, url] of Object.entries(urlsToCheck)) {
        try {
            console.log("url ", url)
            let response;
            if (name == "Backend") {
                response = await checkBackend(url)
            } else {
                response = await axios.get(url);
            }

            console.log("response.status ", response.status, " url ", url)

            if (response.status === 200) {
                results[name] = 'running';
            } else {
                results[name] = 'stopped';
            }
        } catch (error) {
            //console.log("error ",error)
            results[name] = 'stopped';
        }
    }

    return results;
}
exports.bizbScript = async (req, res, next) => {
    try {
        // Define the URLs to check
        const urlsToCheck = {
            Website: 'https://bizb.store',
            Backend: 'https://api.bizb.store/graphql',
            SellerDashboard: 'https://bizb.store/dashboard',
        };
        console.log("urls ", urlsToCheck);
        const statusResults = await checkUrls(urlsToCheck);
        const currentTime = new Date().toLocaleString();
        let emailBody = `Time of test: ${currentTime}\n`;
        emailBody += 'Service status:\n';
        let hasStoppedService = false;

        for (const [name, status] of Object.entries(statusResults)) {
            emailBody += `${name}: ${status}\n`;
            if (status === 'stopped') {
                hasStoppedService = true;
            }
        }

        console.log("emailBody ", emailBody);
        console.log("hasStoppedService ", hasStoppedService)
        console.log("lastSent ", lastSent)
        console.log("moment().subtract(1, 'hour').isAfter(moment(lastSent) ", moment().subtract(1, 'hour').isAfter(moment(lastSent)))
        if (hasStoppedService) {
            sendEmail('Website Status Report', emailBody);
        } else if (!lastSent || moment().subtract(1, 'hour').isAfter(moment(lastSent))) {
            // Check if last email was sent one hour ago using moment
            sendEmail('Website Status Report', emailBody);
            lastSent = new Date();
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(400);
    }
};

cron.schedule('*/15 * * * *', async () => { // Run every 15 minutes
    try {
        // Define the URLs to check
        const urlsToCheck = {
            Website: 'https://bizb.store',
            Backend: 'https://api.bizb.store/graphql',
            SellerDashboard: 'https://bizb.store/dashboard',
        };
        console.log("urls ", urlsToCheck);
        const statusResults = await checkUrls(urlsToCheck);
        const currentTime = new Date().toLocaleString();
        let emailBody = `Time of test: ${currentTime}\n`;
        emailBody += 'Service status:\n';
        let hasStoppedService = false;

        for (const [name, status] of Object.entries(statusResults)) {
            emailBody += `${name}: ${status}\n`;
            if (status === 'stopped') {
                hasStoppedService = true;
            }
        }
        if (hasStoppedService) {
            sendEmail('Website Status Report', emailBody);
        } else if (!lastSent || moment().subtract(1, 'hour').isAfter(moment(lastSent))) {
            // Check if last email was sent one hour ago using moment
            sendEmail('Website Status Report', emailBody);
            lastSent = new Date();
        }

    } catch (err) {
        // Handle any errors that occur during the job
        console.error("Error:", err);
    }
});