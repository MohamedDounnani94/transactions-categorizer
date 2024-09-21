import { ITransaction, CategoryMapping } from '../domain/models/transactions';

export interface BaseRepository<T> {
  save(entity: T): Promise<void>;
}

export interface TransactionRepository extends BaseRepository<ITransaction> {
  findById(id: string): Promise<ITransaction | null>;
  findAll(): Promise<ITransaction[]>;
  upsertAll(transactions: ITransaction[]): Promise<ITransaction[]>;
}

export interface CachedCategoryMappingRepository extends BaseRepository<CategoryMapping> {
  findAllByDescriptions(descriptions: string[]): Promise<CategoryMapping[]>;
}

export interface ExternalClient {
  categorize(descriptions: string[]): Promise<{ [description: string]: string }>;
}
