var express = require("express");
var router = express.Router();
var cors = require("cors");
var {
    generateOTP,
    validateOTP,
    deleteOTP,
    isEmailInWaitlist,
    isEmailApprovedInWaitlist,
    addEmailToWaitlist,
} = require("../logic/otp");
var { createUser, createLoginToken } = require("../logic/user");
var { emailOTP } = require("../logic/email");

// create an api to generate otp
router.options(
    "/generate",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/generate",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    async (req, res) => {
        let { email } = req.body;

        // check that otp is in right format
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            res.json({
                success: false,
                data: { isValid: false },
                error: "Invalid email",
            });
            return;
        }

        const otp = await generateOTP({ email });

        emailOTP({ email, otp });

        res.json({ success: true });
    }
);

// create an api to validate otp
router.options(
    "/validate",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/validate",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    async (req, res) => {
        const { email, otp, fingerprint } = req.body;
        const timezoneOffsetInSeconds = req.body.timezoneOffsetInSeconds || 0;
        const isValid = await validateOTP({ email, otp });

        if (!isValid) {
            res.json({
                success: false,
                data: { isValid },
                error: "Expired or invalid OTP",
            });
            return;
        }

        if (!Number(process.env.SINGLE_USER_MODE)) {
            const emailInWaitlist = await isEmailInWaitlist({ email });

            if (!emailInWaitlist) {
                await addEmailToWaitlist({
                    email,
                    metadata: { timezoneOffsetInSeconds },
                });
            }

            const emailApprovedInWaitlist = await isEmailApprovedInWaitlist({
                email,
            });

            if (!emailApprovedInWaitlist) {
                res.json({
                    success: false,
                    data: { route: "waitlist_wait" },
                    error: "Email not in waitlist",
                });
                return;
            }
        }

        try {
            await createUser({
                email,
                settings: { timezoneOffsetInSeconds },
            });
        } catch (e) {
            console.log(e);
            res.send({
                success: false,
                data: { isValid },
                error: "Error creating user",
            });
            return;
        }

        // get ip address and user agent
        const ip_address =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;

        // create a new login token with 30 days expiry time
        const loginToken = await createLoginToken({
            email,
            fingerprint,
            ip_address,
        });

        // set the login token in the cookie on the root domain (so that it can be accessed by all subdomains)
        res.cookie(
            process.env.COOKIE_UUID_KEY || "browserable_uuid",
            loginToken,
            {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                ...(process.env.NODE_ENV === "production"
                    ? {
                          domain: `.${process.env.ROOT_DOMAIN}`,
                          secure: true,
                          //   httpOnly: true,
                      }
                    : {}),
            }
        );

        await deleteOTP({ email });

        res.json({ success: true, data: { isValid } });
    }
);

router.options(
    "/waitlist-add",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/waitlist-add",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    async (req, res) => {
        const { email, metadata } = req.body;

        if (!email) {
            res.json({
                success: false,
                data: {},
                error: "Invalid email",
            });
            return;
        }

        // check if email is already in waitlist
        const isEmailInWaitlist = await isEmailInWaitlist({ email });

        if (isEmailInWaitlist) {
            res.json({
                success: false,
                data: { route: "waitlist_wait_site" },
                error: "Email already in waitlist",
            });
            return;
        }

        await addEmailToWaitlist({ email, metadata });

        res.json({ success: true, data: { route: "waitlist_added" } });
    }
);

module.exports = router;
