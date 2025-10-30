import { MongoClient, ServerApiVersion } from 'mongodb';

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

let globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  const uri = process.env.MONGO_URI;

  if (!uri || uri === 'YOUR_MONGO_URI_HERE') {
    console.error("MONGO_URI is not set. The application will fail to connect to the database.");
    // Instead of throwing an error at module-load time, we create a
    // promise that will reject. This allows the error to be caught
    // by the request handler's try-catch block.
    globalWithMongo._mongoClientPromise = Promise.reject(new Error("Server Configuration Error: MONGO_URI is not set in the environment variables."));
  } else {
    try {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
      console.log("Creating new MongoDB connection promise.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown MongoDB connection error";
      console.error(`Failed to create MongoDB client. This is likely due to an invalid MONGO_URI format. Error: ${message}`);
      globalWithMongo._mongoClientPromise = Promise.reject(new Error(`Server Configuration Error: Could not connect to the database. Please check the MONGO_URI. Details: ${message}`));
    }
  }
}
clientPromise = globalWithMongo._mongoClientPromise!;

export default clientPromise;