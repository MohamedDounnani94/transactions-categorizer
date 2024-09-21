import { TransactionRepository, ExternalClient } from '../../ports/infrastructure';
import { ITransaction } from '../models/transactions';

export class TransactionCategorizationService {
  constructor(
    private transactionRepository: TransactionRepository,
    private aiClient: ExternalClient,
  ) {}

  async categorizeTransactions(transactions: ITransaction[]): Promise<ITransaction[]> {
    const descriptions = Array.from(
      new Set(transactions.map((transaction) => transaction.description)),
    );

    const categorizedMap = await this.aiClient.categorize(descriptions);

    const categorizedTransactions: ITransaction[] = transactions.map((transaction) => {
      const category =
        transaction.description in categorizedMap
          ? categorizedMap[transaction.description]
          : 'Miscellaneous';
      return { ...transaction, category };
    });
    return categorizedTransactions;
  }

  async saveAll(transactions: ITransaction[]): Promise<void> {
    const categorizedTransactions = await this.categorizeTransactions(transactions);
    this.transactionRepository.upsertAll(categorizedTransactions);
  }

  async getAllTransactions(): Promise<ITransaction[]> {
    return this.transactionRepository.findAll();
  }

  async getTransactionById(id: string): Promise<ITransaction | null> {
    return this.transactionRepository.findById(id);
  }
}
