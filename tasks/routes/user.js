var express = require("express");
var router = express.Router();
var cors = require("cors");
var {
    getUserFromToken,
    doesLoginTokenExist,
    setUserDetails,
    addUserDomain,
} = require("../logic/user");
var { createLoginToken, deleteLoginToken } = require("../logic/user");
var { createAPIKey, getAPIKeys, deleteAPIKey } = require("../logic/api_key");

var { addUserToRequest, checkAccountAccess } = require("../logic/middleware");


router.options("/logout", cors({
    credentials: true,
    origin: process.env.CORS_DOMAINS.split(","),
}));
router.post("/logout", cors({
    credentials: true,
    origin: process.env.CORS_DOMAINS.split(","),
}), async (req, res) => {
    const { fingerprint } = req.body || {};

    await deleteLoginToken({ fingerprint });

    res.clearCookie(
        process.env.COOKIE_UUID_KEY || "browserable_uuid",
        {
            ...(process.env.NODE_ENV === "production"
                ? {
                      domain: `.${process.env.ROOT_DOMAIN}`,
                      secure: true,
                      //   httpOnly: true,
                  }
                : {}),
        }
    );

    res.json({ success: true });
});

// API to fetch user data
// also tells if user is logged in currently or not
router.options(
    "/details",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/details",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    async (req, res) => {
        const { fingerprint, timezoneOffsetInSeconds } = req.body || {};

        // get loginToken as browserable_uuid cookie
        const loginToken =
            req.cookies[process.env.COOKIE_UUID_KEY || "browserable_uuid"];

        try {
            let user = await getUserFromToken({
                token: loginToken,
                fingerprint,
            });

            if (user) {
                res.json({ success: true, data: { user, isLoggedIn: true } });
            } else {
                // check if this is single user mode
                const isSingleUserMode = !!Number(process.env.SINGLE_USER_MODE);

                if (isSingleUserMode) {
                    // get ip address and user agent
                    const ip_address =
                        req.headers["x-forwarded-for"] ||
                        req.connection.remoteAddress;

                    const email = process.env.ADMIN_EMAIL;

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

                    let user = await getUserFromToken({
                        token: loginToken,
                        fingerprint,
                    });

                    // check if settings.timezoneOffsetInSeconds is set
                    if (
                        !user.settings ||
                        !user.settings.timezoneOffsetInSeconds
                    ) {
                        // update the user settings
                        await setUserDetails({
                            user_id: user.id,
                            settings: {
                                ...(user.settings || {}),
                                timezoneOffsetInSeconds,
                            },
                        });

                        user.settings = {
                            ...(user.settings || {}),
                            timezoneOffsetInSeconds,
                        };
                    }

                    res.json({
                        success: true,
                        data: { user, isLoggedIn: true },
                    });
                } else {
                    // delete the cookie if user is not logged in
                    res.clearCookie(
                        process.env.COOKIE_UUID_KEY || "browserable_uuid",
                        {
                            ...(process.env.NODE_ENV === "production"
                                ? {
                                      domain: `.${process.env.ROOT_DOMAIN}`,
                                      secure: true,
                                      //   httpOnly: true,
                                  }
                                : {}),
                        }
                    );

                    res.json({
                        success: false,
                        error: "User not logged in",
                        data: { user: null, isLoggedIn: false },
                    });
                }
            }
        } catch (e) {
            console.log(e);
            // delete the cookie if user is not logged in
            res.clearCookie(process.env.COOKIE_UUID_KEY || "browserable_uuid", {
                ...(process.env.NODE_ENV === "production"
                    ? {
                          domain: `.${process.env.ROOT_DOMAIN}`,
                          secure: true,
                          //   httpOnly: true,
                      }
                    : {}),
            });

            res.json({
                success: false,
                data: { user: null, isLoggedIn: false },
                error: e.message,
            });
            return;
        }
    }
);

// API to update user data
router.options(
    "/update",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/update",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    async (req, res) => {
        const { fingerprint, name, pic, settings } = req.body || {};

        // get loginToken as browserable_uuid cookie
        const token =
            req.cookies[process.env.COOKIE_UUID_KEY || "browserable_uuid"];

        try {
            const user = await getUserFromToken({
                token,
                fingerprint,
            });

            res.json(
                await setUserDetails({
                    user_id: user.id,
                    name,
                    pic,
                    settings,
                })
            );
        } catch (e) {
            res.json({
                success: false,
                error: e.message,
            });
            return;
        }
    }
);

// API Key Routes
router.options(
    "/api-keys/create",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/api-keys/create",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    checkAccountAccess,
    async (req, res) => {
        const { name, accountId } = req.body || {};

        const user = req.user;

        try {
            const { id, apiKey } = await createAPIKey({
                accountId,
                userId: user.id,
                name: name || "Default API Key",
            });

            res.json({ success: true, data: { id, apiKey } });
        } catch (e) {
            console.log(e);
            res.json({ success: false, error: e.message });
        }
    }
);

router.options(
    "/api-keys/get",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/api-keys/get",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    checkAccountAccess,
    async (req, res) => {
        const { accountId } = req.body || {};

        try {
            const apiKeys = await getAPIKeys({ accountId });
            res.json({ success: true, data: { apiKeys } });
        } catch (e) {
            console.log(e);
            res.json({ success: false, error: e.message });
        }
    }
);

router.options(
    "/api-keys/delete",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/api-keys/delete",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    checkAccountAccess,
    async (req, res) => {
        const { accountId, apiKeyId } = req.body || {};

        try {
            await deleteAPIKey({ accountId, apiKeyId });
            res.json({ success: true });
        } catch (e) {
            console.log(e);
            res.json({ success: false, error: e.message });
        }
    }
);

module.exports = router;
