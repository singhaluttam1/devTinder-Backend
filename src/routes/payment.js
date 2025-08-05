const express = require('express')
const { userAuth } = require('../middlewares/auth')
const paymentRouter = express.Router()
const razorpayInstance = require('../utils/rarzorpay')
const Payment = require('../models/payment')
const membershipAmount = require("../utils/constants")
const user = require('../models/user')

// Create payment order
paymentRouter.post('/payment/create', userAuth, async (req, res) => {
    try {
        const { membershipType } = req.body;
        const { firstName, lastName, emailID } = req.user;

        if (!membershipAmount[membershipType]) {
            return res.status(400).json({ error: "Invalid membership type" });
        }

        const amountInPaise = membershipAmount[membershipType] * 100;

        const order = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
            notes: { firstName, lastName, emailID, membershipType },
        });

        const payment = new Payment({
            userId: req.user._id,
            orderId: order.id,
            amount: membershipAmount[membershipType],
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes,
            status: "created",
        });

        const savedPayment = await payment.save();

        res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Razorpay webhook
paymentRouter.post('/payment/webhook', async (req, res) => {
    try {
        const webhookSignature = req.get('x-razorpay-signature');
        if (!webhookSignature) {
            return res.status(400).json({ msg: "Missing webhook signature" });
        }

        const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
        const isValid = validateWebhookSignature(
            req.body.toString(), // RAW body
            webhookSignature,
            process.env.WEBHOOK_SECRET
        );

        if (!isValid) {
            return res.status(400).json({ msg: "Invalid webhook signature" });
        }

        const payload = JSON.parse(req.body.toString());
        const paymentDetails = payload?.payload?.payment?.entity || payload?.payload?.Payment?.entity;

        if (!paymentDetails || !paymentDetails.order_id) {
            return res.status(400).json({ msg: "Invalid payment payload" });
        }

        const existingPayment = await Payment.findOne({ orderId: paymentDetails.order_id });
        if (!existingPayment) {
            return res.status(404).json({ msg: "Payment record not found" });
        }

        // Update payment status
        existingPayment.status = payload.event === 'payment.failed' ? 'failed' : 'captured';
        await existingPayment.save();

        // Mark user as premium if payment was successful
        if (payload.event === 'payment.captured') {
            const userDoc = await user.findById(existingPayment.userId);
            if (userDoc) {
                userDoc.isPremium = true;
                await userDoc.save();
            }
        }

        res.status(200).json({ msg: "Webhook processed successfully" });

    } catch (err) {
        console.error("Webhook error:", err);
        res.status(500).json({ msg: err.message });
    }
});

module.exports = paymentRouter;