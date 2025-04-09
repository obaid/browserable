var axios = require("axios");
const axiosInstance = axios.create({
    withCredentials: true,
});

function sendDiscordAdminAlert(message) {
    // try {
    //     const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK;
    //     const payload = {
    //         content: message,
    //     };
    //     axiosInstance.post(webhookUrl, payload);
    // } catch (err) {
    //     console.log("Failed to send Discord admin alert", err);
    // }
}

module.exports = {
    sendDiscordAdminAlert,
};
