const path = require("path");
const dotenv = require("dotenv");

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv !== "production") {
	dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const env = {
	NODE_ENV: nodeEnv,
	PORT: Number(process.env.PORT || 5000),
	JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
	DATABASE_URL: process.env.DATABASE_URL || "",
	PG_HOST: process.env.PG_HOST || "localhost",
	PG_PORT: Number(process.env.PG_PORT || 5432),
	PG_USER: process.env.PG_USER || "postgres",
	PG_PASSWORD: process.env.PG_PASSWORD || "postgres",
	PG_DATABASE: process.env.PG_DATABASE || "kpr_erp",
	PG_SSL: process.env.PG_SSL === "true",
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	APP_BASE_URL: process.env.APP_BASE_URL || "",
};

const getMissingEnv = () => {
	const requiredInProduction = ["JWT_SECRET", "DATABASE_URL"];
	return requiredInProduction.filter((key) => !String(env[key] || "").trim());
};

const missingEnv = getMissingEnv();
if (env.NODE_ENV === "production" && missingEnv.length > 0) {
	console.warn(`Missing required env values: ${missingEnv.join(", ")}`);
}

module.exports = {
	env,
	missingEnv,
};
