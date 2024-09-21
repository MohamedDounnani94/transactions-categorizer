import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITransaction, CategoryMapping } from '../../domain/models/transactions';
import { TransactionRepository, CachedCategoryMappingRepository } from '../../ports/infrastructure';

interface TransactionDocument extends Document, Omit<ITransaction, 'id'> {}
interface CachedCategoryMappingDocument extends Document, CategoryMapping {}

const TransactionSchema: Schema = new Schema({
  transactionId: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  description: { type: String, required: true },
  transactionType: { type: String, required: true },
  accountNumber: { type: String, required: true },
  category: { type: String, required: true },
});

const CachedCategoryMappingSchema: Schema = new Schema({
  description: { type: String, required: true },
  category: { type: String, required: true },
});

export const TransactionModel: Model<TransactionDocument> = mongoose.model<TransactionDocument>(
  'Transaction',
  TransactionSchema,
);
export const CachedCategoryMappingModel: Model<CachedCategoryMappingDocument> =
  mongoose.model<CachedCategoryMappingDocument>(
    'CachedCategoryMapping',
    CachedCategoryMappingSchema,
  );

export class OrmTransactionRepository implements TransactionRepository {
  async save(transaction: ITransaction): Promise<void> {
    TransactionModel.create(transaction);
  }

  async findAll(): Promise<ITransaction[]> {
    const transactions = await TransactionModel.find();
    return transactions.map(this.transactionDTO);
  }

  async findById(id: string): Promise<ITransaction | null> {
    const transaction = await TransactionModel.findOne({ transactionId: id });
    return transaction ? this.transactionDTO(transaction) : null;
  }

  async upsert(transaction: ITransaction): Promise<void> {
    const { transactionId, ...updateData } = transaction;

    await TransactionModel.findOneAndUpdate(
      { transactionId },
      { $set: updateData },
      { upsert: true },
    );
  }

  async upsertAll(transactions: ITransaction[]): Promise<ITransaction[]> {
    const bulkOps = transactions.map((transaction) => ({
      updateOne: {
        filter: { transactionId: transaction.transactionId },
        update: { $set: transaction },
        upsert: true,
      },
    }));

    await TransactionModel.bulkWrite(bulkOps);
    return this.findAll();
  }

  private transactionDTO(doc: TransactionDocument): ITransaction {
    const {
      transactionId,
      amount,
      timestamp,
      description,
      transactionType,
      accountNumber,
      category,
    } = doc;
    return {
      transactionId,
      amount,
      timestamp,
      description,
      transactionType,
      accountNumber,
      category,
    };
  }
}

export class OrmCachedCategoryMappingRepository implements CachedCategoryMappingRepository {
  async findByDescription(description: string): Promise<CategoryMapping | null> {
    const cachedCategoryMapping = await CachedCategoryMappingModel.findOne({
      description: description,
    });
    return cachedCategoryMapping ? this.cachedCategoryMappingDTO(cachedCategoryMapping) : null;
  }

  async save(cachedCategoryMapping: CategoryMapping): Promise<void> {
    await CachedCategoryMappingModel.create(cachedCategoryMapping);
  }

  async findAllByDescriptions(descriptions: string[]): Promise<CategoryMapping[]> {
    const cachedCategoryMapping = await CachedCategoryMappingModel.find({
      description: { $in: descriptions },
    });
    return cachedCategoryMapping.map(this.cachedCategoryMappingDTO);
  }

  private cachedCategoryMappingDTO(doc: CachedCategoryMappingDocument): CategoryMapping {
    const { description, category } = doc;
    return {
      description,
      category,
    };
  }
}
