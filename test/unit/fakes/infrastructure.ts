import { TransactionRepository, ExternalClient } from '../../../src/ports/infrastructure';
import { ITransaction } from '../../../src/domain/models/transactions';

export class FakeTransactionRepository implements TransactionRepository {
  private transactions: ITransaction[] = [];
  async upsertAll(transactions: ITransaction[]): Promise<ITransaction[]> {
    this.transactions = [...this.transactions, ...transactions];
    return this.transactions;
  }

  async save(transaction: ITransaction): Promise<void> {
    this.transactions = [...this.transactions, transaction];
  }

  async findAll(): Promise<ITransaction[]> {
    return this.transactions;
  }

  async findById(id: string): Promise<ITransaction | null> {
    const transaction = this.transactions.find((transaction) => transaction.transactionId === id);
    return transaction || null;
  }
}

export class FakeAiClient implements ExternalClient {
  async categorize(descriptions: string[]): Promise<{ [description: string]: string }> {
    const categorizedMap: { [description: string]: string } = {};

    descriptions.forEach((description) => {
      categorizedMap[description] = 'Miscellaneous';
    });
    return categorizedMap;
  }
}
