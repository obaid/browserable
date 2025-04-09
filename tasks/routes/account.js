var express = require("express");
var router = express.Router();
var cors = require("cors");
var { getUserFromToken, getUserById } = require("../logic/user");
var {
    getAccountsOfUser,
    createAccountForUser,
    getAccountUsers,
    updateAccountMetadata,
    getAccountPermissions,
    addUserToAccount,
    getAccount,
} = require("../logic/account");
const {
    checkAccountAccess,
    checkAccountAdminAccess,
    addUserToRequest,
} = require("../logic/middleware");
const browserService = require("../services/browser");

// Account create api
router.options(
    "/create",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/create",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    async (req, res) => {
        const { accountName, metadata } = req.body;

        const user = req.user;

        const account = await createAccountForUser({
            userId: user.id,
            accountName: accountName.trim() || "@user",
            metadata,
            emailId: user.emailId,
            role: "admin",
            suggestedAccountId: accountName.trim() || "@user",
        });

        res.send({
            success: true,
            accountId: account,
        });
    }
);

router.options(
    "/get",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/get",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    async (req, res) => {
        const { accountId } = req.body;

        const user = req.user;

        const systemApiKeys = {
            openAI: !!process.env.OPENAI_API_KEY,
            claude: !!process.env.CLAUDE_API_KEY,
            gemini: !!process.env.GEMINI_API_KEY,
            qwen: !!process.env.QWEN_API_KEY,
            deepseek: !!process.env.DEEPSEEK_API_KEY,
        };

        const systemBrowserApiKeys = {
            hyperBrowser: !!process.env.HYPER_BROWSER_API_KEY,
            steel: !!process.env.STEEL_API_KEY,
            browserbase: !!process.env.BROWSERBASE_API_KEY,
        };

        const account = await getAccount({
            accountId,
            userId: user.id,
        });

        if (!account) {
            res.send({
                success: false,
                error: "Account not found",
            });
            return;
        }

        account.metadata = account.metadata || {};
        account.metadata.systemApiKeys = systemApiKeys;
        account.metadata.systemBrowserApiKeys = systemBrowserApiKeys;

        res.send({
            success: true,
            account,
        });
    }
);

// get all accounts of a user
router.options(
    "/get/all",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/get/all",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    async (req, res) => {
        const user = req.user;

        let accounts = await getAccountsOfUser({
            userId: user.id,
        });

        if (accounts.length === 0) {
            // we create a new default account here
            await createAccountForUser({
                userId: user.id,
                accountName: "Default",
                role: "admin",
                emailId: user.email,
            });
        }

        accounts = await getAccountsOfUser({
            userId: user.id,
        });

        res.send({
            success: true,
            accounts,
        });
    }
);

// get users of an account
router.options(
    "/get/users",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/get/users",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    async (req, res) => {
        const { accountId } = req.body;

        const user = req.user;

        const users = await getAccountUsers({
            accountId,
            userId: user.id,
        });

        res.send({
            success: true,
            users,
        });
    }
);

router.options(
    "/update/metadata",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
router.post(
    "/update/metadata",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    addUserToRequest,
    checkAccountAccess,
    async (req, res) => {
        const { accountId, metadata } = req.body;

        await updateAccountMetadata({
            accountId,
            metadata,
        });

        // TODO: (SG) Not happy with this implementation.
        // With LLM Api keys, we use them on-demand and in future, can provide a way for multiple accounts to use different LLM API keys
        // But with browser api keys, it's not built that way. Rework on the browser service to support this properly.
        // Another problem with browser service is that, switching providers when active tasks are running is not supported.

        // if metadata.browserApiKeys, and if it is single user mode, let's reset clients here
        if (metadata && metadata.userBrowserApiKeys) {
            await browserService.resetClients({
                hyperbrowserApiKey: metadata.userBrowserApiKeys.hyperBrowser,
                browserbaseApiKey: metadata.userBrowserApiKeys.browserbase,
                steelApiKey: metadata.userBrowserApiKeys.steel,
            });
        }

        res.send({
            success: true,
        });
    }
);

module.exports = router;
