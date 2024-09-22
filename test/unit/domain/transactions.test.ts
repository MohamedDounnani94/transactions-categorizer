import { TransactionCategorizationService } from '../../../src/domain/services/transactions';
import { TransactionRepository, ExternalClient } from '../../../src/ports/infrastructure';
import { ITransaction } from '../../../src/domain/models/transactions';
import { FakeTransactionRepository, FakeAiClient } from '../fakes/infrastructure';

describe('TransactionCategorizationService', () => {
  let transactionCategorizationService: TransactionCategorizationService;
  let transactionRepository: TransactionRepository;
  let aiClient: ExternalClient;

  beforeEach(() => {
    aiClient = new FakeAiClient();
    transactionRepository = new FakeTransactionRepository();
    transactionCategorizationService = new TransactionCategorizationService(
      transactionRepository,
      aiClient,
    );
  });

  describe('categorizeTransactions', () => {
    it('should categorize transactions and save them', async () => {
      const transactions: ITransaction[] = [
        {
          transactionId: '1',
          description: 'Grocery store purchase',
          amount: 50,
          timestamp: new Date(),
          transactionType: 'debit',
          accountNumber: '1234',
          category: 'Miscellaneous',
        },
        {
          transactionId: '2',
          description: 'PayPal Transfer',
          amount: 100,
          timestamp: new Date(),
          transactionType: 'credit',
          accountNumber: '5678',
          category: 'Miscellaneous',
        },
      ];

      const expectedCategories = {
        'Grocery store purchase': 'Groceries',
        'PayPal Transfer': 'Miscellaneous',
      };
      jest.spyOn(aiClient, 'categorize').mockResolvedValue(expectedCategories);

      jest.spyOn(transactionRepository, 'upsertAll').mockResolvedValue(transactions);
      await transactionCategorizationService.saveAll(transactions);

      expect(transactionRepository.upsertAll).toHaveBeenCalledWith([
        {
          transactionId: '1',
          description: 'Grocery store purchase',
          amount: 50,
          timestamp: expect.any(Date),
          transactionType: 'debit',
          accountNumber: '1234',
          category: 'Groceries',
        },
        {
          transactionId: '2',
          description: 'PayPal Transfer',
          amount: 100,
          timestamp: expect.any(Date),
          transactionType: 'credit',
          accountNumber: '5678',
          category: 'Miscellaneous',
        },
      ]);
      expect(aiClient.categorize).toHaveBeenCalledWith([
        'Grocery store purchase',
        'PayPal Transfer',
      ]);
    });

    it('should fallback to "Miscellaneous" if the OpenAI API call fails', async () => {
      const descriptions = ['Geldmaat ATM Withdrawal', 'PayPal Transfer'];
      const categories = await aiClient.categorize(descriptions);
      expect(categories).toEqual({
        'Geldmaat ATM Withdrawal': 'Miscellaneous',
        'PayPal Transfer': 'Miscellaneous',
      });
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions from the repository', async () => {
      const mockTransactions: ITransaction[] = [
        {
          transactionId: '1',
          description: 'Grocery store purchase',
          amount: 50,
          timestamp: new Date(),
          transactionType: 'debit',
          accountNumber: '1234',
          category: 'Groceries',
        },
      ];

      jest.spyOn(transactionRepository, 'findAll').mockResolvedValue(mockTransactions);

      const result = await transactionCategorizationService.getAllTransactions();

      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getTransactionById', () => {
    it('should return a transaction by ID', async () => {
      const mockTransaction: ITransaction = {
        transactionId: '1',
        description: 'Grocery store purchase',
        amount: 50,
        timestamp: new Date(),
        transactionType: 'debit',
        accountNumber: '1234',
        category: 'Groceries',
      };

      jest.spyOn(transactionRepository, 'findById').mockResolvedValue(mockTransaction);

      const result = await transactionCategorizationService.getTransactionById('1');

      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction not found', async () => {
      jest.spyOn(transactionRepository, 'findById').mockResolvedValue(null);

      const result = await transactionCategorizationService.getTransactionById('999');

      expect(result).toBeNull();
    });
  });
});
