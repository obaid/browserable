var express = require("express");
var router = express.Router();
var cors = require("cors");
var { getUserFromToken } = require("../../logic/user");
const db = require("../../services/db");
const {
    checkAccountAccess,
    checkAccountAdminAccess,
    addUserToRequest,
} = require("../../logic/middleware");

var ALL_INTEGRATIONS = [
    {
        id: "generative",
        name: "Generative AI",
        code: "GENERATIVE_AGENT",
        icon: "generative.png",
        description: "Generative AI integration",
        meta: {
            enabled: true,
            setup: {},
            actions: [],
        },
    },
    {
        id: "browser",
        name: "Browser Agent",
        code: "BROWSER_AGENT",
        icon: "browser.png",
        description: "Browser integration",
        meta: {
            enabled: true,
            setup: {},
            actions: [
            ],
        },
    },
    {
        id: "deepresearch",
        name: "Deep Research",
        code: "DEEPRESEARCH_AGENT",
        icon: "deepresearch.png",
        description: "Deep Research integration",
        meta: {
            enabled: true,
            setup: {},
            actions: [],
        },
    },
];

router.options(
    "/get/paginated",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);

router.post(
    "/get/paginated",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    checkAccountAccess,
    async (req, res) => {
        const { fingerprint, accountId } = req.body || {};

        let user = req.user;

        // for now we return all the integrations.
        let integrations = JSON.parse(JSON.stringify(ALL_INTEGRATIONS));

        // get current integrations of the user of type oauth2
        const tasksDB = await db.getTasksDB();
        const { rows } = await tasksDB.query(
            `SELECT * FROM browserable.integrations WHERE account_id = $1 AND type = 'oauth2'`,
            [accountId]
        );
        integrations.forEach((integration) => {
            if (integration.type === "oauth2") {
                integration.meta.enabled = rows.some(
                    (row) => row.integration === integration.id
                );
                integration.meta.setup.callbackUrl = `${integration.meta.setup.callbackUrl}/${accountId}`;
            }
        });

        res.json({ success: true, data: integrations });
    }
);

module.exports = router;
