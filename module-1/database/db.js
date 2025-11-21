// Mongoose connection helper (ES module)
// Usage (ESM):
//   import { connectToDatabase } from './Utils/database/db.js';
//   await connectToDatabase();
//   import { mongoose } from './Utils/database/db.js';
//   await disconnect();
// Note: Your project must use ESM. Either set "type": "module" in package.json
// or rename this file to db.mjs and import the .mjs path.

import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb+srv://root:152155170185190@aihrcluster.o4l8jnc.mongodb.net/AIHRDB?retryWrites=true&w=majority&appName=AIHRCluster';
export const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

// Connection options recommended for mongoose
const DEFAULT_OPTIONS = {
	dbName: process.env.MONGODB_DB || undefined,
};

let isConnected = false;

export async function connectToDatabase(options = {}) {
	if (isConnected || mongoose.connection.readyState === 1) {
		return mongoose;
	}
	console.log(MONGODB_URI);
	const connectOptions = Object.assign({}, DEFAULT_OPTIONS, options);

	await mongoose.connect(MONGODB_URI, connectOptions);
	isConnected = true;
	console.log("Database connected successfully");
	return mongoose;
}

export async function disconnect() {
	if (!isConnected && mongoose.connection.readyState !== 1) return;
	await mongoose.disconnect();
	isConnected = false;
	console.log("Database disconnected successfully");
}

export { mongoose };

export default {
	connectToDatabase,
	disconnect,
	mongoose,
	MONGODB_URI,
};
