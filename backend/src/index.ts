import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import pool from "./db";

dotenv.config();

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// 🔹 Test de connexion à la DB
pool.connect()
  .then(() => console.log("✅ Connecté à PostgreSQL"))
  .catch((err) => console.error("❌ Erreur de connexion PostgreSQL :", err));

// 🔹 Route de test
app.get("/", (req, res) => {
  res.send({ message: "Bienvenue sur l'API Terracoast 🌍🚀" });
});

// 🔹 Configuration du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
