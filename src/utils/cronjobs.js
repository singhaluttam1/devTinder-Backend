const cron = require('node-cron')
const { subdays, startOfDay, endOfDay } = require('date-fns')
const ConnectionRequest = require('../models/connectionRequest')
const sendEmail = require('./sendEmail')

cron.schedule("* 8 * * * ", async () => {
    //Send Email to all users ho got request on previous day
    try {
        const yesterday = subdays(new Date(), 1)
        const yesterdayStart = startOfDay(yesterday)
        const yesterdayEnd = endOfDay(yesterday)
        const pendingRequests = await ConnectionRequest.find({
            status: "interested",
            createdAt: {
                $gte: yesterdayStart,
                $lte: yesterdayEnd,
            }
        }).populate("fromUserId toUserId")

        const listOfEmails = [...new Set(pendingRequests.map(req => req.toUserId.emailID))]
        for (const email of listOfEmails) {
            try {
                const res = await sendEmail.run("New Friend Request Pending for " + toEmailID, "There are so many request pending for you, Please check your devTinder app for more details", listOfEmails)

            } catch (error) {

            }

        }

    } catch (error) {
        console.error("Error in cron job:", error.message);

    }
    console.log("Hello World", new Date())

})