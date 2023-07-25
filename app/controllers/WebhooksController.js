const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
// const nodemailer = require("nodemailer");
const validator = require('validator');
const json = require("json");
const buffer = require("buffer");
const User = require("../../models/User");
exports.googlePlayWebhooks = async (req, res, next) => {
    try {
        console.log("req.body ", req.body)
        const data = req.body
        console.log("it got hit ", data.message.data)
        const decodedData = JSON.parse(
            await new Buffer(data.message.data, "base64").toString("utf-8")
        );
        console.log("decodedData ", decodedData)
        const subscriptionObject = decodedData.subscriptionNotification;
        const oneTimeProductObject = decodedData.OneTimeProductNotification;
        if (subscriptionObject) {
            console.log("subscriptionObject ", subscriptionObject)
            const purchaseToken = subscriptionObject.purchaseToken;
            const notificationType = subscriptionObject.notificationType;
            switch (notificationType) {

                case 1://SUBSCRIPTION_RECOVERED

                    break;
                case 2://SUBSCRIPTION_RENEWED
                    const userInfo2 = await User.findOne({
                        where: {
                            purchaseToken: purchaseToken
                        },
                    })
                    //regive user access to platform
                    break;
                case 3://SUBSCRIPTION_CANCELED
                    let userInfo3 = await User.findOne({
                        where: {
                            purchaseToken: purchaseToken
                        },
                    })
                    //revoke user access to platform
                    break;
                case 4://SUBSCRIPTION_PURCHASED
                    let userInfo4 = await User.findOne({
                        where: {
                            purchaseToken: purchaseToken
                        },
                    })
                    //attach purchase token to db
                    break;
                case 5://SUBSCRIPTION_ON_HOLD
                    let userInfo5 = await User.findOne({
                        where: {
                            purchaseToken: purchaseToken
                        },
                    })
                    //revoke user access to platform
                    break;
                case 6://SUBSCRIPTION_IN_GRACE_PERIOD

                    break;
                case 7://SUBSCRIPTION_RESTARTED 
                    const userInfo7 = await User.findOne({
                        where: {
                            purchaseToken: purchaseToken
                        },
                    })
                    //regive user access to platform
                    break;
                case 8://SUBSCRIPTION_PRICE_CHANGE_CONFIRMED

                    break;
                case 9://SUBSCRIPTION_DEFERRED

                    break;
                case 10://SUBSCRIPTION_PAUSED
                    let userInfo10 = await User.findOne({
                        where: {
                            purchaseToken: purchaseToken
                        },
                    })
                    //revoke user access to platform
                    break;
                case 11://SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED

                    break;
                case 12://SUBSCRIPTION_REVOKED

                    break;
                case 13://SUBSCRIPTION_EXPIRED

                    break;
                default:
                    console.log('Unhandled event type:', notificationType);
            }
            return res.status(200); //Sending ok response
        }else if(oneTimeProductObject){
            console.log("oneTimeProductObject ", oneTimeProductObject)
            const purchaseToken = oneTimeProductObject.purchaseToken;
            const notificationType = oneTimeProductObject.notificationType;
            switch (notificationType) {

                case 1://ONE_TIME_PRODUCT_PURCHASED

                    break;
                case 2://ONE_TIME_PRODUCT_CANCELED

                    break;
                default:
                    console.log('Unhandled event type:', notificationType);
            }
            return res.status(200);
        } else {
            return res.status(200); //Sending ok response
        }

    } catch (err) {
        console.error(err);
        return res.status(500).send({ status: false, message: 'Sorry! Something went wrong.', error: err.message });
    }
};
exports.stripeWebhooks = async (req, res, next) => {
    // Get the Stripe signature from the headers
    const signature = req.headers['stripe-signature'];
    console.log("event recieing")
    try {
        // Verify the webhook signature using your Stripe webhook signing secret
        console.log("process.env.STRIPE_WEBHOOK_SECRET ", process.env.STRIPE_WEBHOOK_SECRET)
        const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        // Handle the event based on its type
        let ifUser = null;
        let customerEmail = null;
        let priceId = null;
        let ifPlan = null;
        switch (event.type) {

            case 'checkout.session.completed':
                const checkoutSessionCompleted = event.data.object;
                console.log("checkoutSessionCompleted ", checkoutSessionCompleted)
                if (checkoutSessionCompleted.subscription) {
                    console.log("checkoutSessionCompleted.subscription ", checkoutSessionCompleted.subscription)
                }
                // Then define and call a function to handle the event subscription_schedule.aborted
                break;
            case 'customer.subscription.created':
                const customerSubscriptionCreated = event.data.object;
                console.log("customerSubscriptionCreated ", customerSubscriptionCreated)
                const customer = await stripe.customers.retrieve(
                    customerSubscriptionCreated?.customer
                );
                console.log("customer ", customer)
                customerEmail = customer?.email?.toLowerCase();;
                ifUser = await User.findOne({ email: customerEmail });
                priceId = customerSubscriptionCreated?.plan?.id
                ifPlan = await Plan.findOne({ priceId: priceId })
                if (ifUser) {
                    console.log("ifUser ", ifUser)
                    console.log("ifPlan ", ifPlan)
                    const subscriptionId = customerSubscriptionCreated?.id;
                    const subscriptionStatus = customerSubscriptionCreated?.status;
                    console.log("subscriptionId, subscriptionStatus ", subscriptionId, subscriptionStatus)
                    if (ifUser?.subscriptionStatus == 'active' && customerSubscriptionCreated?.status == 'incomplete') {
                        //cancel incomplete subscription
                        const deleted = await stripe.subscriptions.del(
                            customerSubscriptionCreated?.id
                        );
                    } else if (customerSubscriptionCreated.status == "active" && customerSubscriptionCreated.status == "trialing") {
                        const updatedUser = await User.updateOne(
                            { _id: ifUser._id },
                            {
                                $set: {
                                    planId: ifPlan?._id,
                                    isPaid: true,
                                    //shouldLoginAfter: dateAndTimeAfter48Hours,
                                    subscriptionId: subscriptionId,
                                    subscriptionStatus: subscriptionStatus
                                }
                            }, { new: true }
                        );
                        console.log("updatedUser ", updatedUser)
                        await updateContactsSubscriptionStatus(customerEmail, subscriptionStatus)
                    } else {
                        console.log("subscription failed somehow")
                    }


                }
                // Then define and call a function to handle the event subscription_schedule.aborted
                break;
            case 'customer.subscription.updated':
                const customerSubscriptionUpdated = event.data.object;
                console.log("customerSubscriptionUpdated ", customerSubscriptionUpdated)
                if (customerSubscriptionUpdated.cancel_at_period_end) {
                    // Return a successful response to Stripe
                    return res.sendStatus(200);
                }
                const customer3 = await stripe.customers.retrieve(
                    customerSubscriptionUpdated?.customer
                );
                console.log("customer3 ", customer3)
                customerEmail = customer3?.email?.toLowerCase();
                ifUser = await User.findOne({ email: customerEmail });
                console.log("ifUser ", ifUser)
                const subscriptionId = customerSubscriptionUpdated?.id;
                const subscriptionStatus = customerSubscriptionUpdated?.status;
                console.log("subscriptionId, subscriptionStatus ", subscriptionId, subscriptionStatus)
                priceId = customerSubscriptionUpdated?.plan?.id
                ifPlan = await Plan.findOne({ priceId: priceId })
                if (customerSubscriptionUpdated.status == 'past_due' && ifUser.subscriptionStatus == 'active' && customerSubscriptionUpdated.id == ifUser?.subscriptionId) {
                    const toBeFreemiumEvent = await new toBeFreemium({
                        userId: ifUser?._id,
                        subscriptionId: customerSubscriptionUpdated?.id
                    }).save()
                    console.log("toBeFreemiumEvent ", toBeFreemiumEvent)
                }
                if (customerSubscriptionUpdated.status == 'incomplete_expired' || customerSubscriptionUpdated.status == 'incomplete' || customerSubscriptionUpdated.status == 'cancelled') {

                } else if (customerSubscriptionUpdated.status != "active" && customerSubscriptionUpdated.status != "trialing") {
                    const updatedUser = await User.updateOne(
                        { _id: ifUser._id },
                        {
                            $set: {
                                planId: ifPlan?._id,
                                isPaid: true,
                                //shouldLoginAfter: dateAndTimeAfter48Hours,
                                subscriptionId: subscriptionId,
                                subscriptionStatus: subscriptionStatus
                            }
                        }, { new: true }
                    );
                    await updateContactsSubscriptionStatus(customerEmail, subscriptionStatus)
                    console.log("updatedUser ", updatedUser)
                } else {
                    console.log("its activing and trailing ")
                    const updatedUser = await User.updateOne(
                        { _id: ifUser?._id },
                        {
                            $set: {
                                planId: ifPlan?._id,
                                isPaid: true,
                                //shouldLoginAfter: dateAndTimeAfter48Hours,
                                subscriptionId: subscriptionId,
                                subscriptionStatus: subscriptionStatus
                            }
                        }, { new: true }
                    );
                    await updateContactsSubscriptionStatus(customerEmail, subscriptionStatus)
                    console.log("updatedUser ", updatedUser)
                }
                // Then define and call a function to handle the event subscription_schedule.canceled
                break;
            case 'customer.subscription.deleted':
                const customerSubscriptionDeleted = event.data.object;
                console.log("customerSubscriptionDeleted ", customerSubscriptionDeleted)
                const customer4 = await stripe.customers.retrieve(
                    customerSubscriptionDeleted?.customer
                );
                console.log("customer4 ", customer4)
                customerEmail = customer4.email;
                ifUser = await User.findOne({ email: customerEmail });
                console.log("ifUser ", ifUser)
                if (ifUser?.subscriptionId == customerSubscriptionDeleted.id) {
                    const updatedUser = await User.updateOne(
                        { _id: ifUser?._id },
                        {
                            $set: {
                                isPaid: false,
                                //shouldLoginAfter: dateAndTimeAfter48Hours,
                                subscriptionStatus: "canceled"
                            }
                        }, { new: true }
                    );
                    console.log("updatedUser ", updatedUser)
                    const deletedFreemiumEvent = await toBeFreemium.deleteOne({ subscriptionId: ifUser?.subscriptionId });
                    await updateIsPaidUserStatus(customerEmail, false)
                }

                // Then define and call a function to handle the event subscription_schedule.canceled
                break;
            case 'subscription_schedule.completed':
                const subscriptionScheduleCompleted = event.data.object;
                console.log("subscriptionScheduleCompleted ", subscriptionScheduleCompleted)
                // Then define and call a function to handle the event subscription_schedule.completed
                break;
            case 'subscription_schedule.created':
                const subscriptionScheduleCreated = event.data.object;
                console.log("subscriptionScheduleCreated", subscriptionScheduleCreated)
                const customer2 = await stripe.customers.retrieve(
                    subscriptionScheduleCreated?.customer
                );
                console.log("customer2 ", customer2)
                customerEmail = customer2.email;
                ifUser = await User.findOne({ email: customerEmail });
                priceId = subscriptionScheduleCreated?.items?.data[0]?.price?.id
                ifPlan = await Plan.findOne({ priceId: priceId })
                if (ifUser) {
                    console.log("ifUser ", ifUser)
                    console.log("ifPlan ", ifPlan)
                    // const updatedUser = await User.updateOne(
                    //     { _id: ifUser._id },
                    //     {
                    //         $set: {
                    //             planId: ifPlan?._id,
                    //             isPaid: true,
                    //             //shouldLoginAfter: dateAndTimeAfter48Hours,
                    //             subscriptionId: subscriptionId
                    //         }
                    //     }, { new: true }
                    // );
                }
                // Then define and call a function to handle the event subscription_schedule.created
                break;
            case 'subscription_schedule.expiring':
                const subscriptionScheduleExpiring = event.data.object;
                console.log("subscriptionScheduleExpiring ", subscriptionScheduleExpiring)
                // Then define and call a function to handle the event subscription_schedule.expiring
                break;
            case 'subscription_schedule.released':
                const subscriptionScheduleReleased = event.data.object;
                console.log("subscriptionScheduleReleased ", subscriptionScheduleReleased)
                // Then define and call a function to handle the event subscription_schedule.released
                break;
            case 'subscription_schedule.updated':
                const subscriptionScheduleUpdated = event.data.object;
                console.log("subscriptionScheduleUpdated ", subscriptionScheduleUpdated)
                // Then define and call a function to handle the event subscription_schedule.updated
                break;
            case 'invoice.payment_succeeded':
                const invoicePaymentSucceeded = event.data.object;
                console.log("invoicePaymentSucceeded ", invoicePaymentSucceeded)
                customerEmail = invoicePaymentSucceeded.customer_email;
                const subscriptionInformation = await stripe.subscriptions.retrieve(
                    invoicePaymentSucceeded.subscription,
                    {
                        expand: ['default_payment_method']
                    }
                );
                const last4 = subscriptionInformation.default_payment_method.card.last4;
                const address = subscriptionInformation.default_payment_method.billing_details.address;
                console.log("subscriptionInformation.plan.interval ", subscriptionInformation.plan.interval)
                let SubPlan
                if (subscriptionInformation.plan.interval == "month") {
                    SubPlan = "Monthly"
                } else if (subscriptionInformation.plan.interval == "year") {
                    SubPlan = "Yearly"
                }
                console.log("SubPlan ", SubPlan)
                ifUser = await User.findOne({ email: customerEmail });

                console.log("invoicePaymentSucceeded.status_transitions.paid_at ", invoicePaymentSucceeded.status_transitions.paid_at)
                const monthNames = [
                    { number: 1, name: 'January' },
                    { number: 2, name: 'February' },
                    { number: 3, name: 'March' },
                    { number: 4, name: 'April' },
                    { number: 5, name: 'May' },
                    { number: 6, name: 'June' },
                    { number: 7, name: 'July' },
                    { number: 8, name: 'August' },
                    { number: 9, name: 'September' },
                    { number: 10, name: 'October' },
                    { number: 11, name: 'November' },
                    { number: 12, name: 'December' }
                ];

                const paidAtTimestamp = invoicePaymentSucceeded.status_transitions.paid_at;
                const paidAtDate = new Date(paidAtTimestamp * 1000); // Multiply by 1000 to convert from Unix timestamp to JavaScript timestamp
                const paidAtMonthNumber = paidAtDate.getMonth() + 1; // Add 1 because getMonth() returns a zero-based index
                const paidAtMonthName = monthNames.find(month => month.number === paidAtMonthNumber)?.name;

                console.log('Paid date:', paidAtDate.getDate()); // Get the day of the month (1-31)
                console.log('Paid month:', paidAtMonthName);
                console.log("address ", address)
                let addressString = ""
                if (address.line1) {
                    addressString = addressString + address.line1 + ", "
                }
                if (address.line2) {
                    addressString = addressString + address.line2 + ", "
                }
                if (address.city) {
                    addressString = addressString + address.city + ", "
                }
                if (address.state) {
                    addressString = addressString + address.state + ", "
                }
                if (address.country) {
                    addressString = addressString + address.country + ", "
                }
                console.log("addressString ", addressString)
                let replacements = {
                    Username: ifUser.userName,
                    url: invoicePaymentSucceeded?.hosted_invoice_url,
                    last4: last4,
                    amountPaid: invoicePaymentSucceeded?.amount_paid / 100,
                    Plan: SubPlan,
                    Month: paidAtMonthName,
                    addressString: addressString
                };
                console.log("replacements ", replacements)
                const subject = 'Welcome Onboard'
                console.log("subject ", subject)
                const html = await readHTMLFile('./src/helpers/Invoice.html');
                //console.log(" html ", html)
                console.log("email sending")
                const template = handlebars.compile(html);
                const htmlToSend = template(replacements);
                const emailResponse = await sendEmail(customerEmail, 1234, subject, htmlToSend)
                if (ifUser?.subscriptionId == subscriptionInformation.id) {
                    const deletedFreemiumEvent = await toBeFreemium.deleteOne({ subscriptionId: ifUser?.subscriptionId });
                }
                // Then define and call a function to handle the event subscription_schedule.updated
                break;
            default:
                console.log('Unhandled event type:', event.type);
        }

        // Return a successful response to Stripe
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(400);
    }
};