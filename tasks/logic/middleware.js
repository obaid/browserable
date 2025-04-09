const { getAccount, getAccountPermissions } = require("./account");
const { getUserFromToken } = require("./user");

const addUserToRequest = async (req, res, next) => {
    const loginToken =
        req.cookies[process.env.COOKIE_UUID_KEY || "browserable_uuid"];
    let fingerprint = req.body.fingerprint;
    if (!fingerprint) {
        fingerprint = req.query.fingerprint;
    }
    const user = await getUserFromToken({
        token: loginToken,
        fingerprint,
    });
    req.user = user;
    next();
};

const addUserToRequestFromCookie = async (req, res, next) => {
    const loginToken =
        req.cookies[process.env.COOKIE_UUID_KEY || "browserable_uuid"];
    const user = await getUserFromToken({
        token: loginToken,
        allowWithoutFingerprint: true,
    });
    req.user = user;
    next();
};

const checkAccountAccess = async (req, res, next) => {


    let { accountId } = req.params;
    if (!accountId) {
        accountId = req.body.accountId;
    }
    if (!accountId) {
        accountId = req.query.state;
    }

    if (!req.user || !req.user.id) {
        res.send({
            success: false,
            message: "User not found",
        });
        return;
    }


    const account = await getAccount({ accountId, userId: req.user.id });
    if (!account) {
        res.send({
            success: false,
            message: "Account not found",
        });
        return;
    }

    // check if the user has access to the account
    const access = await getAccountPermissions({ userId: req.user.id, accountId });
    if (!access) {
        res.send({
            success: false,
            message: "You are not authorized to access this account",
        });
        return;
    }

    next();
};

const checkAccountAdminAccess = async (req, res, next) => {
    let { accountId } = req.params;
    if (!accountId) {
        accountId = req.body.accountId;
    }
    if (!accountId) {
        accountId = req.query.state;
    }
    const account = await getAccount({ accountId, userId: req.user.id });
    if (!account) {
        res.send({
            success: false,
            message: "Account not found",
        });
        return;
    }

    // check if the user is an admin
    const permissions = await getAccountPermissions({ userId: req.user.id, accountId });
    if (permissions !== "admin") {
        res.send({
            success: false,
            message: "You are not authorized to access this account",
        });
        return;
    }

    next();
};

module.exports = {
    checkAccountAccess,
    checkAccountAdminAccess,
    addUserToRequest,
    addUserToRequestFromCookie,
};
