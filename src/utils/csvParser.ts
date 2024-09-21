import csv from 'csv-parser';
import { ITransaction } from '../domain/models/transactions';
import { Readable } from 'stream';

export const parseCSV = (buffer: Buffer): Promise<ITransaction[]> => {
  return new Promise((resolve, reject) => {
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    const transactions: ITransaction[] = [];
    readableStream
      .pipe(csv())
      .on('data', (row) => {
        const transaction: ITransaction = {
          transactionId: row['Transaction ID'],
          amount: parseFloat(row['Amount']) || 0,
          timestamp: (row['Timestamp']),
          description: row['Description'],
          transactionType: row['Transaction Type'],
          accountNumber: row['Account Number'],
          category: 'Miscellaneous',
        };
        transactions.push(transaction);
      })
      .on('end', () => {
        resolve(transactions);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
