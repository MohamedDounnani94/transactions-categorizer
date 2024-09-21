export interface ITransaction {
  transactionId: string;
  amount: number;
  timestamp: Date;
  description: string;
  transactionType: string;
  accountNumber: string;
  category: string;
}

export type CategoryMapping = Pick<ITransaction, 'category' | 'description'>;
