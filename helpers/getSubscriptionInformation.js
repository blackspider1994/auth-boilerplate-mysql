const { google } = require("googleapis");

const client = google.androidpublisher('v3');
//const OAuth2 = google.auth.OAuth2();

const SERVICE_ACCOUNT_EMAIL = "dealdocapp@gmail.com";
const SERVICE_ACCOUNT_KEY_FILE = require("./googleplaycredentails.json");
const {CLIENT_EMAIL,PRIVATE_KEY}=process.env
console.log("CLIENT_EMAIL,PRIVATE_KEY ",CLIENT_EMAIL,PRIVATE_KEY)
const jwtClient = new google.auth.JWT(
    SERVICE_ACCOUNT_KEY_FILE.client_email?SERVICE_ACCOUNT_KEY_FILE.client_email:CLIENT_EMAIL,
    null,
    SERVICE_ACCOUNT_KEY_FILE.private_key?SERVICE_ACCOUNT_KEY_FILE.private_key:PRIVATE_KEY,
    ["https://www.googleapis.com/auth/androidpublisher"],
    null
);
async function getSubcriptionInformation(purchaseToken, subscriptionId, packageName) {
    try {
        const response = await client.purchases.subscriptions.get(
            {
                auth: jwtClient,
                packageName: packageName,
                subscriptionId: subscriptionId,
                token: purchaseToken
            }
        );
        return response.data
    } catch (err) {
        return null
    }
}
module.exports = {
    getSubcriptionInformation
}