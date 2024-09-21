import OpenAI from 'openai';
import { ExternalClient } from '../../ports/infrastructure';
import { CategoryMapping } from '../../domain/models/transactions';
import { CachedCategoryMappingRepository } from '../../ports/infrastructure';
import { CATEGORIES } from '../../utils/constants';

export class AIClient implements ExternalClient {
  private openai: OpenAI;

  constructor(
    apiKey: string,
    private cachedCategoryMappingRepository: CachedCategoryMappingRepository,
  ) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  generatePrompt(descriptions: string[]): string {
    return `You are tasked with categorizing the following descriptions. 
    For each description, please provide the category from the following list: 
    ${CATEGORIES.join(', ')}.
    
    Descriptions:
    ${descriptions.join('\n')}
    
    Please return the response in the format: 
    "description: category" for each description, one per line:
    `;
  }

  async categorize(descriptions: string[]): Promise<{ [description: string]: string }> {
    // Find if there are already the descriptions
    const cachedCategoryMapping =
      await this.cachedCategoryMappingRepository.findAllByDescriptions(descriptions);

    const cachedMap: { [description: string]: string } = {};

    // Build a map for cached category improving lookup performance
    // Creating a map will also reduce the descriptions to check
    // removing duplicated
    cachedCategoryMapping.forEach((cached: CategoryMapping) => {
      cachedMap[cached.description] = cached.category;
    });

    // This will reduce the amount of descriptions to categorize
    const uncategorizedDescriptions = descriptions.filter(
      (description) => !(description in cachedMap),
    );

    const categorizedMap: { [description: string]: string } = { ...cachedMap };

    // If we have already all the categorized descriptions we don't need to call OpenAI API
    if (uncategorizedDescriptions.length === 0) {
      return categorizedMap;
    }

    const prompt = this.generatePrompt(uncategorizedDescriptions);

    try {
      const categoryResponse = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
      });

      const firstChoice = categoryResponse.choices[0];
      if (firstChoice && firstChoice.message && firstChoice.message.content) {
        const responses = firstChoice.message.content.trim().split('\n');

        responses.forEach((response: string) => {
          const [description, category] = response.split(':').map((item) => item.trim());
          this.cachedCategoryMappingRepository.save({
            description,
            category,
          });
          categorizedMap[description] = category || 'Miscellaneous';
        });
      } else {
        // If OpenAI doesn't return valid content, fallback to 'Miscellaneous'
        descriptions.forEach((description) => {
          categorizedMap[description] = 'Miscellaneous';
        });
      }
    } catch (error) {
      console.error('Error categorizing transactions:', error);

      // In case of error, default all descriptions to 'Miscellaneous'
      descriptions.forEach((description) => {
        categorizedMap[description] = 'Miscellaneous';
      });
    }
    return categorizedMap;
  }
}
