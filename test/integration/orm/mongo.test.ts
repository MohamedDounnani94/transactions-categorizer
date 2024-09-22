import mongoose from 'mongoose';
import {
  OrmTransactionRepository,
  TransactionModel,
  OrmCachedCategoryMappingRepository,
  CachedCategoryMappingModel,
} from '../../../src/adapters/orm/mongo';
import { ITransaction, CategoryMapping } from '../../../src/domain/models/transactions';

describe('MongoRepository Integration Tests', () => {
  let transactionRepository: OrmTransactionRepository;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_DB_URI || 'mongodb://mongo:27017/categorizer-test');
    transactionRepository = new OrmTransactionRepository();
  });

  afterEach(async () => {
    await TransactionModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('saveAll', () => {
    it('should save multiple transactions', async () => {
      const transactions: ITransaction[] = [
        {
          transactionId: '1',
          amount: 50,
          timestamp: new Date(),
          description: 'Grocery store purchase',
          transactionType: 'debit',
          accountNumber: '12345678',
          category: 'Groceries',
        },
        {
          transactionId: '2',
          amount: 100,
          timestamp: new Date(),
          description: 'PayPal Transfer',
          transactionType: 'credit',
          accountNumber: '87654321',
          category: 'Miscellaneous',
        },
      ];

      const savedTransactions = await transactionRepository.upsertAll(transactions);

      expect(savedTransactions).toHaveLength(2);
      expect(savedTransactions[0]).toMatchObject(transactions[0]);
      expect(savedTransactions[1]).toMatchObject(transactions[1]);
    });
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      const transactions: ITransaction[] = [
        {
          transactionId: '1',
          amount: 50,
          timestamp: new Date(),
          description: 'Grocery store purchase',
          transactionType: 'debit',
          accountNumber: '12345678',
          category: 'Groceries',
        },
        {
          transactionId: '2',
          amount: 100,
          timestamp: new Date(),
          description: 'PayPal Transfer',
          transactionType: 'credit',
          accountNumber: '87654321',
          category: 'Miscellaneous',
        },
      ];

      await transactionRepository.upsertAll(transactions);
      const foundTransactions = await transactionRepository.findAll();

      expect(foundTransactions).toHaveLength(2);
      expect(foundTransactions).toEqual(expect.arrayContaining(transactions));
    });
  });

  describe('findById', () => {
    it('should return a transaction by ID', async () => {
      const transaction: ITransaction = {
        transactionId: '1',
        amount: 50,
        timestamp: new Date(),
        description: 'Grocery store purchase',
        transactionType: 'debit',
        accountNumber: '12345678',
        category: 'Groceries',
      };

      await transactionRepository.upsertAll([transaction]);
      const foundTransaction = await transactionRepository.findById('1');

      expect(foundTransaction).toMatchObject(transaction);
    });

    it('should return null if the transaction does not exist', async () => {
      const foundTransaction = await transactionRepository.findById('999');
      expect(foundTransaction).toBeNull();
    });
  });
});

describe('OrmCachedCategoryMappingRepository Integration Tests', () => {
  let categoryMappingRepository: OrmCachedCategoryMappingRepository;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_DB_URI || 'mongodb://mongo:27017/categorizer-test');
    categoryMappingRepository = new OrmCachedCategoryMappingRepository();
  });

  afterEach(async () => {
    await CachedCategoryMappingModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('save', () => {
    it('should save a category mapping', async () => {
      const categoryMapping: CategoryMapping = {
        description: 'Grocery store purchase',
        category: 'Groceries',
      };

      await categoryMappingRepository.save(categoryMapping);

      const savedMapping = await CachedCategoryMappingModel.findOne({
        description: 'Grocery store purchase',
      });
      expect(savedMapping).toMatchObject(categoryMapping);
    });
  });

  describe('findByDescription', () => {
    it('should return a category mapping by description', async () => {
      const categoryMapping: CategoryMapping = {
        description: 'Grocery store purchase',
        category: 'Groceries',
      };

      await categoryMappingRepository.save(categoryMapping);
      const foundMapping =
        await categoryMappingRepository.findByDescription('Grocery store purchase');

      expect(foundMapping).toMatchObject(categoryMapping);
    });

    it('should return null if the category mapping does not exist', async () => {
      const foundMapping = await categoryMappingRepository.findByDescription('Unknown description');
      expect(foundMapping).toBeNull();
    });
  });

  describe('findAllByDescriptions', () => {
    it('should return multiple category mappings for the given descriptions', async () => {
      const categoryMappings: CategoryMapping[] = [
        { description: 'Grocery store purchase', category: 'Groceries' },
        { description: 'Online shopping', category: 'E-Commerce' },
      ];

      for (const mapping of categoryMappings) {
        await categoryMappingRepository.save(mapping);
      }

      const foundMappings = await categoryMappingRepository.findAllByDescriptions([
        'Grocery store purchase',
        'Online shopping',
      ]);

      expect(foundMappings).toHaveLength(2);
      expect(foundMappings).toEqual(expect.arrayContaining(categoryMappings));
    });

    it('should return an empty array if no mappings are found', async () => {
      const foundMappings = await categoryMappingRepository.findAllByDescriptions([
        'Unknown description',
      ]);
      expect(foundMappings).toHaveLength(0);
    });
  });
});
