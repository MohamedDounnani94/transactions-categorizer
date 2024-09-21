import express from "express";
import { createTransactionRoutes } from "./api/ruotes";

const app = express();

app.use(express.json());

const start = async () => {
  app.use("/transactions", createTransactionRoutes());
};

start();

export default app;
