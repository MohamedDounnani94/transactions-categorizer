import { Request, Response } from 'express';
import { TransactionCategorizationService } from '../../domain/services/transactions';
import { parseCSV } from '../../utils/csvParser';
import { ITransaction } from '../../domain/models/transactions';
export class TransactionController {
  constructor(private transactionCategorizationService: TransactionCategorizationService) {}

  async submit(req: Request, res: Response): Promise<Response> {
    const {
      transactionId,
      amount,
      timestamp,
      description,
      transactionType,
      accountNumber,
    }: ITransaction = req.body;

    const transaction: ITransaction = {
      transactionId,
      amount,
      timestamp,
      description,
      transactionType,
      accountNumber,
      category: 'Miscellaneus',
    };

    try {
      await this.transactionCategorizationService.saveAll([transaction]);
      return res.status(201).json({ message: 'Successfully ingested the data' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error submitting transaction' });
    }
  }

  async submitFile(req: Request, res: Response): Promise<Response> {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const transactions = await parseCSV(req.file.buffer);
    try {
      await this.transactionCategorizationService.saveAll(transactions);
      return res.status(201).json({ message: 'Successfully ingested the data' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error submitting transaction' });
    }
  }

  async getAll(_: Request, res: Response): Promise<Response> {
    try {
      const transactions = await this.transactionCategorizationService.getAllTransactions();
      return res.json(transactions);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error retrieving transactions' });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const transaction = await this.transactionCategorizationService.getTransactionById(
        req.params.id,
      );
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      } else {
        return res.json(transaction);
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error retrieving transaction' });
    }
  }
}
