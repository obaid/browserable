const db = require("../services/db");

const { baseQueue } = require("../services/queue");

// add a job that runs every 2 hours and removed old otps
baseQueue.add(
    "removeOldOTPs",
    {},
    {
        repeat: {
            every: 2 * 60 * 60 * 1000,
        },
    }
);

baseQueue.process("removeOldOTPs", async (job, done) => {
    const tasksDB = await db.getTasksDB();

    // remove all otps that are older than 2 hours
    await tasksDB.query(
        `DELETE FROM browserable.otp WHERE created_at < NOW() - INTERVAL '120 minutes'`
    );

    done();
});

// generate random 6 digit OTP
function uniqueOTP() {
    const digits = "0123456789";
    let OTP = "";

    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    return OTP;
}

async function generateOTP({ email }) {
    const tasksDB = await db.getTasksDB();

    // check if there is an OTP for this email id that is already present in DB
    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.otp WHERE processed_email = $1`,
        [(email || "").toLowerCase().split(".").join("")]
    );

    if (rows.length > 0) {
        return rows[0].otp;
    } else {
        // generate a new OTP until the newly generated OTP is not present in DB
        let newOTP = uniqueOTP();
        // while (true) {
        //     const { rows } = await tasksDB.query(
        //         `SELECT * FROM browserable.otp WHERE otp = $1`,
        //         [newOTP]
        //     );

        //     if (rows.length > 0) {
        //         newOTP = uniqueOTP();
        //     } else {
        //         break;
        //     }
        // }

        // insert the new OTP in DB
        await tasksDB.query(
            `INSERT INTO browserable.otp (otp, email, processed_email, created_at) VALUES ($1, $2, $3, $4)`,
            [
                newOTP,
                email,
                (email || "").toLowerCase().split(".").join(""),
                new Date(),
            ]
        );

        return newOTP;
    }
}

async function validateOTP({ email, otp }) {
    const tasksDB = await db.getTasksDB();
    const client = await tasksDB.connect();

    // check if there is an OTP for this email id that is already present in DB
    const { rows } = await client.query(
        `SELECT * FROM browserable.otp WHERE processed_email = $1 AND otp = $2`,
        [(email || "").toLowerCase().split(".").join(""), otp]
    );

    client.release();

    if (rows.length > 0) {
        return true;
    } else {
        return false;
    }
}

async function deleteOTP({ email }) {
    const tasksDB = await db.getTasksDB();
    const client = await tasksDB.connect();

    // delete the OTP for this email id
    await client.query(
        `DELETE FROM browserable.otp WHERE processed_email = $1`,
        [(email || "").toLowerCase().split(".").join("")]
    );

    client.release();

    return true;
}

async function isEmailApprovedInWaitlist({ email }) {
    const tasksDB = await db.getTasksDB();
    const processedEmail = (email || "").toLowerCase().split(".").join("");

    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.waitlist WHERE processed_email = $1 AND approved = true`,
        [processedEmail]
    );

    return rows.length > 0;
}

async function isEmailInWaitlist({ email }) {
    const tasksDB = await db.getTasksDB();
    const processedEmail = (email || "").toLowerCase().split(".").join("");

    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.waitlist WHERE processed_email = $1`,
        [processedEmail]
    );

    return rows.length > 0;
}

async function addEmailToWaitlist({ email, metadata }) {
    const tasksDB = await db.getTasksDB();
    const processedEmail = (email || "").toLowerCase().split(".").join("");

    await tasksDB.query(
        `INSERT INTO browserable.waitlist (email, processed_email, metadata) VALUES ($1, $2, $3)`,
        [email, processedEmail, JSON.stringify(metadata || {})]
    );
}

module.exports = {
    generateOTP,
    validateOTP,
    deleteOTP,
    isEmailApprovedInWaitlist,
    isEmailInWaitlist,
    addEmailToWaitlist,
};
