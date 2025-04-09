const { MongoClient } = require("mongodb");

class MongoDB {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async getConnection() {
        if (!this.client) {
            this.client = new MongoClient(process.env.MONGODB_URL);
            await this.client.connect();
            this.db = this.client.db("browserable");
        }
        return this.db;
    }

    async init() {
        try {
            const db = await this.getConnection();
            
            // Check if collection exists, if not create it
            const collections = await db.listCollections({ name: 'data-table' }).toArray();
            if (collections.length === 0) {
                await db.createCollection('data-table');
                console.log('Created data-table collection');
            }
            
            console.log('MongoDB initialized successfully');
        } catch (error) {
            console.error('MongoDB initialization error:', error);
            throw error;
        }
    }

    version() {
        return "0.0.1";
    }
}

const mongodbInstance = new MongoDB();
mongodbInstance.init();

module.exports = mongodbInstance;
