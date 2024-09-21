import express from 'express';
import { OrmTransactionRepository, OrmCachedCategoryMappingRepository } from './adapters/orm/mongo';
import { connectDB } from './adapters/orm/mongoConnection';
import { AIClient } from './adapters/openAi/client';
import { TransactionCategorizationService } from './domain/services/transactions';
import { TransactionController } from './api/controllers/transactions';
import { createTransactionRoutes } from './api/ruotes';

const app = express();

app.use(express.json());

const start = async () => {
  await connectDB();

  const transactionRepository = new OrmTransactionRepository();
  const cachedCategoryAndDescriptionRepository = new OrmCachedCategoryMappingRepository();
  const aiClient = new AIClient(
    process.env.OPENAI_API_KEY || '',
    cachedCategoryAndDescriptionRepository,
  );
  const transactionCategorizationService = new TransactionCategorizationService(
    transactionRepository,
    aiClient,
  );
  const transactionController = new TransactionController(transactionCategorizationService);

  app.use('/transactions', createTransactionRoutes(transactionController));
};

start();

export default app;
