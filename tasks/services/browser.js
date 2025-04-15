const { Hyperbrowser } = require("@hyperbrowser/sdk");
const Browserbase = require("@browserbasehq/sdk");
const Steel = require("steel-sdk");
const db = require("./db");
const axios = require("axios");
const crypto = require("crypto");
const { chromium } = require("playwright");

class BrowserService {
    constructor({
        hyperbrowserApiKey,
        browserbaseApiKey,
        browserbaseProjectId,
        steelApiKey,
    } = {}) {
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
        this.browserbaseProjectId =
            process.env.BROWSERBASE_PROJECT_ID || browserbaseProjectId;

        this.localBrowserServiceUrl = process.env.LOCAL_BROWSER_SERVICE_URL;

        this.browserableClient = process.env.LOCAL_BROWSER_SERVICE_URL
            ? {
                  sessions: {
                      create: async (options) => {
                          // Create a new browser instance through the API
                          const response = await axios.post(
                              `${this.localBrowserServiceUrl}/create`,
                              {},
                              {
                                  headers: {
                                      Host: "localhost",
                                  },
                              }
                          );

                          const { uniqueId, debuggerUrl } = response.data;

                          // Convert localhost to host.docker.internal in wsEndpoint
                          const dockerWsEndpoint = debuggerUrl.replace(
                              "localhost",
                              "host.docker.internal"
                          );

                          return {
                              id: uniqueId,
                              connectUrl: dockerWsEndpoint,
                              liveUrl: "", // Local browser doesn't have a live URL
                              wsEndpoint: dockerWsEndpoint,
                          };
                      },
                      retrieve: async (sessionId) => {
                          // Get browser instance status through the API
                          const response = await axios.get(
                              `${this.localBrowserServiceUrl}/get/${sessionId}`,
                              {
                                  headers: {
                                      Host: "localhost",
                                  },
                              }
                          );
                          const data = response.data;

                          let { uniqueId, debuggerUrl, status } = data;

                          if (status === "active") {
                              debuggerUrl = debuggerUrl.replace(
                                  "localhost",
                                  "host.docker.internal"
                              );
                          }

                          return {
                              id: uniqueId,
                              connectUrl: debuggerUrl,
                              status,
                              liveUrl: "", // Local browser doesn't have a live URL
                              wsEndpoint: debuggerUrl,
                          };
                      },
                      context: async (sessionId) => {
                          return {};
                      },
                      stop: async (sessionId) => {
                          // Stop browser instance through the API
                          await axios.post(
                              `${this.localBrowserServiceUrl}/stop`,
                              {
                                  uniqueId: sessionId,
                              },
                              {
                                  headers: {
                                      Host: "localhost",
                                  },
                              }
                          );
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
        this.steelApiKey = process.env.STEEL_API_KEY || steelApiKey;

        this.provider = this.steelClient
            ? "steel"
            : this.hyperbrowserClient
            ? "hyperbrowser"
            : this.browserbaseClient
            ? "browserbase"
            : this.browserableClient
            ? "browserable"
            : null;
    }

    async getCurrentProvider() {
        return this.provider;
    }

    async getNewProfile() {
        if (this.provider === "browserable") {
            // BROWSERABLE VERSION
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
        if (this.provider === "browserable") {
            // BROWSERABLE VERSION
            const session = await this.browserableClient.sessions.create({
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
                    width: Number(process.env.BROWSER_WIDTH),
                    height: Number(process.env.BROWSER_HEIGHT),
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
                    width: Number(process.env.BROWSER_WIDTH),
                    height: Number(process.env.BROWSER_HEIGHT),
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
                        width: Number(process.env.BROWSER_WIDTH),
                        height: Number(process.env.BROWSER_HEIGHT),
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
            if (this.provider === "browserable") {
                // BROWSERABLE VERSION
                await this.browserableClient.sessions.stop(sessionId);
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
        if (this.provider === "browserable") {
            // BROWSERABLE VERSION
            const session = await this.browserableClient.sessions.retrieve(
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
                wsEndpoint: this.steelApiKey
                    ? `wss://connect.steel.dev?apiKey=${this.steelApiKey}&sessionId=${sessionId}`
                    : `${session.websocketUrl}`,
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
        // TODO: (SG) add browserable support
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
                    viewport: {
                        width: Number(process.env.BROWSER_WIDTH),
                        height: Number(process.env.BROWSER_HEIGHT),
                    },
                });
            }

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

    async resetClients({
        hyperbrowserApiKey,
        browserbaseApiKey,
        browserbaseProjectId,
        steelApiKey,
    }) {
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
        this.browserbaseProjectId =
            process.env.BROWSERBASE_PROJECT_ID || browserbaseProjectId;
        this.steelClient =
            process.env.STEEL_API_KEY || steelApiKey
                ? new Steel({
                      steelAPIKey: process.env.STEEL_API_KEY || steelApiKey,
                  })
                : null;
        this.steelApiKey = process.env.STEEL_API_KEY || steelApiKey;

        this.provider = this.steelClient
            ? "steel"
            : this.hyperbrowserClient
            ? "hyperbrowser"
            : this.browserbaseClient
            ? "browserbase"
            : this.browserableClient
            ? "browserable"
            : null;

        this.client =
            this.steelClient ||
            this.hyperbrowserClient ||
            this.browserbaseClient ||
            this.browserableClient;

        return this.client;
    }
}

const browserService = new BrowserService();

module.exports = browserService;
