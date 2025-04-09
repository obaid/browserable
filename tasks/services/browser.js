const { Hyperbrowser } = require("@hyperbrowser/sdk");
const Browserbase = require("@browserbasehq/sdk");
const Steel = require("steel-sdk");
const db = require("./db");
const axios = require("axios");
const crypto = require("crypto");
const { chromium } = require("playwright");

class BrowserService {
    constructor({ hyperbrowserApiKey, browserbaseApiKey, browserbaseProjectId, steelApiKey } = {}) {
        this.hyperbrowserClient =
            process.env.HYPER_BROWSER_API_KEY || hyperbrowserApiKey
                ? new Hyperbrowser({
                      apiKey:
                          process.env.HYPER_BROWSER_API_KEY ||
                          hyperbrowserApiKey,
                  })
                : null;
        this.browserbaseClient =
            process.env.BROWSERBASE_API_KEY || browserbaseApiKey
                ? new Browserbase({
                      apiKey:
                          process.env.BROWSERBASE_API_KEY || browserbaseApiKey,
                  })
                : null;
        this.browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID || browserbaseProjectId;

        // TODO: (SG) Playwright client is not tested yet.
        this.playwrightClient = process.env.PLAYWRIGHT_URL
            ? {
                  sessions: {
                      create: async (options) => {
                          return {
                              id: crypto.randomUUID(),
                              connectUrl: `${process.env.PLAYWRIGHT_WS_URL}`,
                              liveUrl: `${process.env.PLAYWRIGHT_URL}`,
                              wsEndpoint: `${process.env.PLAYWRIGHT_WS_URL}`,
                          };
                      },
                      retrieve: async (sessionId) => {
                          return {
                              id: sessionId,
                              connectUrl: `${process.env.PLAYWRIGHT_WS_URL}`,
                              liveUrl: ``,
                              wsEndpoint: `${process.env.PLAYWRIGHT_WS_URL}`,
                          };
                      },
                      context: async (sessionId) => {
                          return {};
                      },
                      release: async (sessionId) => {
                          return {
                              id: sessionId,
                          };
                      },
                  },
              }
            : null;
        this.steelClient =
            process.env.STEEL_API_KEY || steelApiKey
                ? new Steel({
                      steelAPIKey: process.env.STEEL_API_KEY || steelApiKey,
                  })
                : null;

        this.provider = this.playwrightClient
            ? "playwright"
            : this.steelClient
            ? "steel"
            : this.hyperbrowserClient
            ? "hyperbrowser"
            : this.browserbaseClient
            ? "browserbase"
            : null;

        // By maintaining playwright connections with us, instead of connecting everytime, we are making this faster BUT also losing out on multiple servers handling jobs of a single browser agent.
        // With keep alive connections, we don't need this but for local development, we need this.
        // TODO: (SG) Figure out a better way to handle this.
        this.PLAYWRIGHT_CONNECTIONS = {};
        this.startStalePlaywrightConnectionsCleanup();
    }

    async getCurrentProvider() {
        return this.provider;
    }

    async getNewProfile() {
        if (this.provider === "playwright") {
            // PLAYWRIGHT VERSION
            const profileId = crypto.randomUUID();
            return profileId;
        } else if (this.provider === "hyperbrowser") {
            // HYPERBROWSER VERSION
            const profile = await this.hyperbrowserClient.profiles.create();
            return profile.id;
        } else if (this.provider === "steel") {
            // STEEL VERSION
            const profileId = crypto.randomUUID();
            return profileId;
        } else if (this.provider === "browserbase") {
            // BROWSERBASE VERSION
            const profile = await this.browserbaseClient.contexts.create({
                projectId: this.browserbaseProjectId,
            });
            return profile.id;
        }
    }

    async getNewSession({ profileId, profileContext }) {
        if (this.provider === "playwright") {
            // PLAYWRIGHT VERSION
            const session = await this.playwrightClient.sessions.create({
                profile: {
                    id: profileId,
                },
            });

            return {
                success: true,
                sessionId: session.id,
                connectUrl: session.connectUrl,
                liveUrl: session.liveUrl,
            };
        } else if (this.provider === "hyperbrowser") {
            // HYPERBROWSER VERSION
            const session = await this.hyperbrowserClient.sessions.create({
                // solveCaptchas: true,
                // adblock: true,
                // annoyances: true,
                // trackers: true,
                profile: {
                    id: profileId,
                    persistChanges: true,
                },
                screen: {
                    width: 1920,
                    height: 1920,
                },
                enableWebRecording: true,
            });

            return {
                success: true,
                sessionId: session.id,
                connectUrl: session.connectUrl,
                liveUrl: session.liveUrl,
            };
        } else if (this.provider === "steel") {
            const uniqueId = crypto.randomUUID();

            // STEEL VERSION
            const session = await this.steelClient.sessions.create({
                sessionContext: profileContext || {},
                sessionId: uniqueId,
                dimensions: {
                    width: 1920,
                    height: 1920,
                },
                timeout: 60 * 60 * 1000,
            });

            return {
                success: true,
                sessionId: session.id,
                connectUrl: session.websocketUrl,
                liveUrl: session.debugUrl,
            };
        } else if (this.provider === "browserbase") {
            // BROWSERBASE VERSION
            const session = await this.browserbaseClient.sessions.create({
                projectId: this.browserbaseProjectId,
                browserSettings: {
                    context: {
                        id: profileId,
                        persist: true,
                    },
                    viewport: {
                        width: 1920,
                        height: 1920,
                    },
                },
                // keepAlive: true, // available in starter plan only
                // timeout: 60 * 60 * 1000, // available in starter plan only so removing for now
            });
            return session;
        }
    }

    async stopSession({ token, sessionId }) {
        // TODO: (SG) add browserbase support
        try {
            if (this.provider === "playwright") {
                // PLAYWRIGHT VERSION
                await this.playwrightClient.sessions.stop(sessionId);
            } else if (this.provider === "hyperbrowser") {
                // HYPERBROWSER VERSION
                await this.hyperbrowserClient.sessions.stop(sessionId);
            } else if (this.provider === "steel") {
                let context = null;
                try {
                    context = await this.steelClient.sessions.context(
                        sessionId
                    );
                } catch (err) {}
                await this.steelClient.sessions.release(sessionId);
                return context;
            } else if (this.provider === "browserbase") {
                await this.browserbaseClient.sessions.update(sessionId, {
                    projectId: this.browserbaseProjectId,
                    status: "REQUEST_RELEASE",
                });
            }
        } catch (err) {
            console.log("error in stopSession", err);
        }
    }

    async getSessionById({ sessionId }) {
        // TODO: (SG) add browserbase support
        if (this.provider === "playwright") {
            // PLAYWRIGHT VERSION
            const session = await this.playwrightClient.sessions.retrieve(
                sessionId
            );
            return {
                success: true,
                sessionId,
                connectUrl: session.connectUrl,
                liveUrl: session.liveUrl,
                running: session.status === "active",
                wsEndpoint: session.wsEndpoint,
            };
        } else if (this.provider === "hyperbrowser") {
            // HYPERBROWSER VERSION
            const session = await this.hyperbrowserClient.sessions.get(
                sessionId
            );
            return {
                success: true,
                sessionId,
                connectUrl: `${session.wsEndpoint}&keepAlive=true`,
                liveUrl: session.liveUrl,
                running: session.status === "active",
                wsEndpoint: `${session.wsEndpoint}&keepAlive=true`,
            };
        } else if (this.provider === "steel") {
            const session = await this.steelClient.sessions.retrieve(sessionId);
            return {
                success: true,
                sessionId,
                connectUrl: session.websocketUrl,
                liveUrl: session.debugUrl,
                running: session.status === "live",
                wsEndpoint: process.env.STEEL_API_KEY
                    ? `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${sessionId}`
                    : `${session.websocketUrl}`,
                // wsEndpoint: process.env.STEEL_API_KEY
                //     ? `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${sessionId}`
                //     : `${session.websocketUrl}devtools/browser/${sessionId}`,
            };
        } else if (this.provider === "browserbase") {
            // BROWSERBASE VERSION
            const session = await this.browserbaseClient.sessions.retrieve(
                sessionId
            );
            const sessionDebugInfo =
                await this.browserbaseClient.sessions.debug(sessionId);
            return {
                success: true,
                sessionId,
                connectUrl: sessionDebugInfo.wsUrl,
                liveUrl: sessionDebugInfo.debuggerUrl,
                running: session.status === "RUNNING",
                wsEndpoint: sessionDebugInfo.wsUrl,
            };
        }
    }

    async scrape({ url, onlyMainContent = true, formats = ["markdown"] }) {
        // TODO: (SG) add browserbase support
        if (this.provider === "hyperbrowser") {
            const scrapeResult =
                await this.hyperbrowserClient.scrape.startAndWait({
                    url,
                    scrapeOptions: {
                        formats,
                        onlyMainContent,
                        timeout: 15000,
                    },
                });

            return scrapeResult;
        } else if (this.provider === "steel") {
            const scrapeResult = await this.steelClient.scrape({
                url,
                format: formats
                    .map((x) => (x === "html" ? "cleaned_html" : x))
                    .filter((x) => x !== "links"),
            });

            return {
                data: {
                    markdown: scrapeResult.content.markdown,
                    metadata: scrapeResult.metadata,
                    links: scrapeResult.links,
                    html: scrapeResult.content.cleaned_html,
                },
            };
        }
    }

    async getPlaywrightBrowser({ sessionId, connectUrl, attempt = 1 }) {
        try {
            if (this.PLAYWRIGHT_CONNECTIONS[sessionId]) {
                return this.PLAYWRIGHT_CONNECTIONS[sessionId];
            }

            const session = await this.getSessionById({
                sessionId,
            });

            const browser = await chromium.connectOverCDP(session.wsEndpoint, {
                timeout: 90000,
            });

            // create a context if there is none
            let context = browser.contexts()[0];

            if (!context) {
                context = await browser.newContext({
                    viewport: { width: 1920, height: 1920 },
                });
            }

            this.PLAYWRIGHT_CONNECTIONS[sessionId] = {
                browser,
                context,
                createdAt: Date.now(),
            };

            return {
                browser,
                context,
            };
        } catch (e) {
            if (attempt < 3) {
                console.log(
                    "Error connecting to browser. Retrying...",
                    e,
                    attempt
                );
                return this.getPlaywrightBrowser({
                    sessionId,
                    connectUrl,
                    attempt: attempt + 1,
                });
            }
            throw e;
        }
    }

    removeStalePlaywrightConnections() {
        const now = Date.now();
        Object.keys(this.PLAYWRIGHT_CONNECTIONS).forEach((sessionId) => {
            if (
                now - this.PLAYWRIGHT_CONNECTIONS[sessionId].createdAt >
                60 * 60 * 1000
            ) {
                this.closePlaywrightBrowser({ sessionId });
            }
        });
    }

    startStalePlaywrightConnectionsCleanup() {
        setInterval(() => {
            this.removeStalePlaywrightConnections();
        }, 10 * 60 * 1000);
    }

    async closePlaywrightBrowser({ sessionId }) {
        if (!this.PLAYWRIGHT_CONNECTIONS[sessionId]) {
            return;
        }
        const { browser, context } = this.PLAYWRIGHT_CONNECTIONS[sessionId];
        try {
            await browser.close();
            await context.close();
        } catch (error) {
            console.log("Error closing browser session. Moving on.", error);
        }
        delete this.PLAYWRIGHT_CONNECTIONS[sessionId];
    }

    async resetClients({ hyperbrowserApiKey, browserbaseApiKey, browserbaseProjectId, steelApiKey }) {
        this.hyperbrowserClient =
            process.env.HYPER_BROWSER_API_KEY || hyperbrowserApiKey
                ? new Hyperbrowser({
                      apiKey:
                          process.env.HYPER_BROWSER_API_KEY ||
                          hyperbrowserApiKey,
                  })
                : null;
        this.browserbaseClient =
            process.env.BROWSERBASE_API_KEY || browserbaseApiKey
                ? new Browserbase({
                      apiKey:
                          process.env.BROWSERBASE_API_KEY || browserbaseApiKey,
                  })
                : null;
        this.browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID || browserbaseProjectId;
        this.steelClient =
            process.env.STEEL_API_KEY || steelApiKey
                ? new Steel({
                      steelAPIKey: process.env.STEEL_API_KEY || steelApiKey,
                  })
                : null;

        this.provider = this.playwrightClient
            ? "playwright"
            : this.steelClient
            ? "steel"
            : this.hyperbrowserClient
            ? "hyperbrowser"
            : this.browserbaseClient
            ? "browserbase"
            : null;

        this.client =
            this.playwrightClient ||
            this.steelClient ||
            this.hyperbrowserClient ||
            this.browserbaseClient;

        return this.client;
    }
}

const browserService = new BrowserService();

module.exports = browserService;
