import { parseCSV } from '../../src/utils/csvParser';
import { ITransaction } from '../../src/domain/models/transactions';
import { Transform } from 'stream';
import csv from 'csv-parser';

jest.mock('csv-parser');

describe('parseCSV', () => {
  const mockCSVParser = csv as jest.MockedFunction<typeof csv>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createTransformStream = (rows: object[]) => {
    const transform = new Transform({ objectMode: true });

    transform._transform = (_chunk, _encoding, callback) => {
      rows.forEach((row) => {
        transform.push(row);
      });
      callback();
    };

    transform._flush = (callback) => {
      transform.push(null);
      callback();
    };

    return transform;
  };

  it('should parse CSV buffer and return transactions', async () => {
    const mockBuffer =
      Buffer.from(`Transaction ID,Amount,Timestamp,Description,Transaction Type,Account Number
1,100.50,2023-09-18T12:34:56,Grocery Store Purchase,debit,12345678
2,200.75,2023-09-18T13:45:12,ATM Withdrawal,credit,87654321`);

    const expectedTransactions: ITransaction[] = [
      {
        transactionId: '1',
        amount: 100.5,
        timestamp: new Date('2023-09-18T12:34:56'),
        description: 'Grocery Store Purchase',
        transactionType: 'debit',
        accountNumber: '12345678',
        category: 'Miscellaneous',
      },
      {
        transactionId: '2',
        amount: 200.75,
        timestamp: new Date('2023-09-18T13:45:12'),
        description: 'ATM Withdrawal',
        transactionType: 'credit',
        accountNumber: '87654321',
        category: 'Miscellaneous',
      },
    ];

    const rows = [
      {
        'Transaction ID': '1',
        Amount: '100.50',
        Timestamp: '2023-09-18T12:34:56',
        Description: 'Grocery Store Purchase',
        'Transaction Type': 'debit',
        'Account Number': '12345678',
      },
      {
        'Transaction ID': '2',
        Amount: '200.75',
        Timestamp: '2023-09-18T13:45:12',
        Description: 'ATM Withdrawal',
        'Transaction Type': 'credit',
        'Account Number': '87654321',
      },
    ];

    mockCSVParser.mockImplementation(() => createTransformStream(rows));

    const transactions = await parseCSV(mockBuffer);

    expect(transactions).toEqual(expectedTransactions);
  });

  it('should handle empty CSV buffer', async () => {
    const mockBuffer = Buffer.from('');

    mockCSVParser.mockImplementation(() => createTransformStream([]));

    const transactions = await parseCSV(mockBuffer);

    expect(transactions).toEqual([]);
  });

  it('should reject when an error occurs during parsing', async () => {
    const mockBuffer = Buffer.from('Invalid CSV data');
    const transform = new Transform({ objectMode: true });
    transform._transform = jest.fn((_chunk, _encoding, callback) => {
      transform.emit('error', new Error('Malformed CSV data'));
      callback();
    });

    mockCSVParser.mockImplementation(() => transform);

    await expect(parseCSV(mockBuffer)).rejects.toThrow('Malformed CSV data');
  });
});
