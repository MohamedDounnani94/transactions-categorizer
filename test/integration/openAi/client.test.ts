import { AIClient } from '../../../src/adapters/openAi/client';
import { CachedCategoryMappingRepository } from '../../../src/ports/infrastructure';
import { CategoryMapping } from '../../../src/domain/models/transactions';
import { CATEGORIES } from '../../../src/utils/constants';
import OpenAI from 'openai';

let mockCreate = jest.fn().mockResolvedValue({
  choices: [{ message: { content: 'Mocked response' } }],
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  });
});

describe('AiClient Integration Tests', () => {
  let aiClient: AIClient;
  let mockCachedCategoryMappingRepository: jest.Mocked<CachedCategoryMappingRepository>;

  const apiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCachedCategoryMappingRepository = {
      findAllByDescriptions: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<CachedCategoryMappingRepository>;
  });

  describe('generatePrompt', () => {
    it('should generate the correct prompt for given descriptions', () => {
      const descriptions = ['Grocery store purchase', 'PayPal Transfer'];
      aiClient = new AIClient(apiKey, mockCachedCategoryMappingRepository);
      const prompt = aiClient.generatePrompt(descriptions);

      const expectedPrompt = `You are tasked with categorizing the following descriptions. 
    For each description, please provide the category from the following list: 
    ${CATEGORIES.join(', ')}.
    
    Descriptions:
    ${descriptions.join('\n')}
    
    Please return the response in the format: 
    "description: category" for each description, one per line:
    `;
      expect(prompt).toBe(expectedPrompt);
    });
  });

  describe('categorize', () => {
    it('should return categories for cached descriptions without calling OpenAI', async () => {
      const descriptions = ['Grocery store purchase'];
      const cachedMappings: CategoryMapping[] = [
        { description: 'Grocery store purchase', category: 'Groceries' },
      ];

      mockCachedCategoryMappingRepository.findAllByDescriptions.mockResolvedValue(cachedMappings);
      aiClient = new AIClient(apiKey, mockCachedCategoryMappingRepository);
      const result = await aiClient.categorize(descriptions);
      expect(mockCachedCategoryMappingRepository.findAllByDescriptions).toHaveBeenCalledWith(
        descriptions,
      );
      expect(result).toEqual({ 'Grocery store purchase': 'Groceries' });
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should call OpenAI and return categories for uncached descriptions', async () => {
      const descriptions = ['Municipal Tax Payment'];
      const promptResponse = {
        choices: [
          {
            message: {
              content: 'Municipal Tax Payment: Utilities',
            },
          },
        ],
      };

      mockCachedCategoryMappingRepository.findAllByDescriptions.mockResolvedValue([]);
      mockCreate.mockResolvedValue(promptResponse);
      aiClient = new AIClient(apiKey, mockCachedCategoryMappingRepository);
      const result = await aiClient.categorize(descriptions);

      expect(mockCachedCategoryMappingRepository.findAllByDescriptions).toHaveBeenCalledWith(
        descriptions,
      );
      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('Municipal Tax Payment'),
          },
        ],
        model: 'gpt-4o',
      });
      expect(result).toEqual({ 'Municipal Tax Payment': 'Utilities' });
      expect(mockCachedCategoryMappingRepository.save).toHaveBeenCalledWith({
        description: 'Municipal Tax Payment',
        category: 'Utilities',
      });
    });

    it('should handle OpenAI errors and categorize as "Miscellaneous"', async () => {
      const descriptions = ['Unknown Transaction'];

      mockCachedCategoryMappingRepository.findAllByDescriptions.mockResolvedValue([]);
      mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      aiClient = new AIClient(apiKey, mockCachedCategoryMappingRepository);
      const result = await aiClient.categorize(descriptions);

      expect(result).toEqual({ 'Unknown Transaction': 'Miscellaneous' });
      expect(mockCachedCategoryMappingRepository.save).not.toHaveBeenCalled();
    });

    it('should return "Miscellaneous" when OpenAI returns no valid response', async () => {
      const descriptions = ['Empty Response Test'];
      const promptResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };

      mockCachedCategoryMappingRepository.findAllByDescriptions.mockResolvedValue([]);
      mockCreate.mockResolvedValue(promptResponse);
      aiClient = new AIClient(apiKey, mockCachedCategoryMappingRepository);
      const result = await aiClient.categorize(descriptions);

      expect(result).toEqual({ 'Empty Response Test': 'Miscellaneous' });
      expect(mockCachedCategoryMappingRepository.save).not.toHaveBeenCalled();
    });
  });
});
