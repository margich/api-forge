import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Model, ParsedModels, ValidationResult } from '../types';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'gpt-4o-mini'),
}));

// Import after mocking
const { PromptParserService } = await import('../services/promptParserService');
const { generateObject } = await import('ai');
const mockGenerateObject = vi.mocked(generateObject);

describe('PromptParserService', () => {
  let service: PromptParserService;

  beforeEach(() => {
    service = new PromptParserService();
    vi.clearAllMocks();
  });

  describe('parsePrompt', () => {
    it('should parse a simple user model prompt using AI', async () => {
      // Mock AI response
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'User',
              description: 'User model',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
                { name: 'email', type: 'email', required: true, unique: true },
                {
                  name: 'password',
                  type: 'string',
                  required: true,
                  unique: false,
                },
              ],
            },
          ],
          relationships: [],
          confidence: 0.9,
          ambiguities: [],
        },
      });

      const prompt = 'Users have name, email, and password';
      const result: ParsedModels = await service.parsePrompt(prompt);

      expect(result.models).toHaveLength(1);
      expect(result.models[0].name).toBe('User');
      expect(result.models[0].fields).toHaveLength(4); // id + 3 specified fields
      expect(result.models[0].fields.some((f) => f.name === 'name')).toBe(true);
      expect(result.models[0].fields.some((f) => f.name === 'email')).toBe(
        true
      );
      expect(result.models[0].fields.some((f) => f.name === 'password')).toBe(
        true
      );
      expect(result.models[0].fields.some((f) => f.name === 'id')).toBe(true);
      expect(result.confidence).toBe(0.9);
    });

    it('should parse multiple models with relationships', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'User',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
                { name: 'email', type: 'email', required: true, unique: true },
              ],
            },
            {
              name: 'Post',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                  required: true,
                  unique: false,
                },
                {
                  name: 'content',
                  type: 'text',
                  required: true,
                  unique: false,
                },
              ],
            },
          ],
          relationships: [
            {
              sourceModel: 'User',
              targetModel: 'Post',
              type: 'oneToMany',
              description: 'User has many posts',
            },
          ],
          confidence: 0.85,
          ambiguities: [],
        },
      });

      const prompt =
        'Users have many posts. Posts belong to users and have title and content.';
      const result: ParsedModels = await service.parsePrompt(prompt);

      expect(result.models).toHaveLength(2);

      const userModel = result.models.find((m) => m.name === 'User');
      const postModel = result.models.find((m) => m.name === 'Post');

      expect(userModel).toBeDefined();
      expect(postModel).toBeDefined();
      expect(postModel?.fields.some((f) => f.name === 'title')).toBe(true);
      expect(postModel?.fields.some((f) => f.name === 'content')).toBe(true);

      // Check for relationships
      expect(userModel?.relationships).toHaveLength(1);
      expect(userModel?.relationships[0].type).toBe('oneToMany');
      expect(userModel?.relationships[0].targetModel).toBe('Post');
    });

    it('should handle product and order scenario', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'Product',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  unique: false,
                },
                {
                  name: 'description',
                  type: 'text',
                  required: false,
                  unique: false,
                },
              ],
            },
            {
              name: 'Order',
              fields: [
                {
                  name: 'total',
                  type: 'number',
                  required: true,
                  unique: false,
                },
                {
                  name: 'orderDate',
                  type: 'date',
                  required: true,
                  unique: false,
                },
              ],
            },
          ],
          relationships: [
            {
              sourceModel: 'Order',
              targetModel: 'Product',
              type: 'manyToMany',
              description: 'Order contains products',
            },
          ],
          confidence: 0.8,
          ambiguities: [],
        },
      });

      const prompt =
        'Products have name, price, and description. Orders contain products and have total amount and order date.';
      const result: ParsedModels = await service.parsePrompt(prompt);

      expect(result.models).toHaveLength(2);

      const productModel = result.models.find((m) => m.name === 'Product');
      const orderModel = result.models.find((m) => m.name === 'Order');

      expect(productModel).toBeDefined();
      expect(orderModel).toBeDefined();

      // Check product fields
      expect(productModel?.fields.some((f) => f.name === 'name')).toBe(true);
      expect(
        productModel?.fields.some(
          (f) => f.name === 'price' && f.type === 'number'
        )
      ).toBe(true);
      expect(productModel?.fields.some((f) => f.name === 'description')).toBe(
        true
      );

      // Check order fields
      expect(orderModel?.fields.some((f) => f.name === 'total')).toBe(true);
      expect(orderModel?.fields.some((f) => f.name === 'orderDate')).toBe(true);
    });

    it('should detect field types correctly', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'User',
              fields: [
                { name: 'email', type: 'email', required: true, unique: true },
                { name: 'age', type: 'number', required: false, unique: false },
                {
                  name: 'active',
                  type: 'boolean',
                  required: false,
                  unique: false,
                },
                {
                  name: 'birthday',
                  type: 'date',
                  required: false,
                  unique: false,
                },
              ],
            },
          ],
          relationships: [],
          confidence: 0.9,
          ambiguities: [],
        },
      });

      const prompt =
        'Users have email address, age number, active flag, and birthday date';
      const result: ParsedModels = await service.parsePrompt(prompt);

      expect(result.models).toHaveLength(1);
      const userModel = result.models[0];

      const emailField = userModel.fields.find((f) => f.name === 'email');
      const ageField = userModel.fields.find((f) => f.name === 'age');
      const activeField = userModel.fields.find((f) => f.name === 'active');
      const birthdayField = userModel.fields.find((f) => f.name === 'birthday');

      expect(emailField?.type).toBe('email');
      expect(ageField?.type).toBe('number');
      expect(activeField?.type).toBe('boolean');
      expect(birthdayField?.type).toBe('date');
    });

    it('should handle empty or invalid prompts gracefully', async () => {
      const emptyPrompt = '';
      const result: ParsedModels = await service.parsePrompt(emptyPrompt);

      expect(result.models).toHaveLength(0);
      expect(result.confidence).toBe(0);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].severity).toBe('warning');
    });

    it('should identify ambiguities in prompts', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'User',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
              ],
            },
          ],
          relationships: [],
          confidence: 0.5,
          ambiguities: [
            {
              text: 'stuff',
              reason: 'Vague term',
              suggestions: ['Consider using more specific field names'],
            },
            {
              text: 'they',
              reason: 'Ambiguous pronoun',
              suggestions: ['Specify which entity you are referring to'],
            },
          ],
        },
      });

      const ambiguousPrompt =
        'Users have stuff and things. They are related to it.';
      const result: ParsedModels = await service.parsePrompt(ambiguousPrompt);

      expect(result.ambiguities.length).toBeGreaterThan(0);
      expect(result.ambiguities.some((a) => a.text === 'stuff')).toBe(true);
      expect(result.ambiguities.some((a) => a.text === 'they')).toBe(true);
    });

    it('should generate appropriate suggestions for low confidence', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'User',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
              ],
            },
          ],
          relationships: [],
          confidence: 0.5, // Low confidence
          ambiguities: [],
        },
      });

      const simplePrompt = 'User has name';
      const result: ParsedModels = await service.parsePrompt(simplePrompt);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(
        result.suggestions.some((s) => s.message.includes('low confidence'))
      ).toBe(true);
    });

    it('should handle AI service errors gracefully with fallback', async () => {
      mockGenerateObject.mockRejectedValue(new Error('AI service unavailable'));

      const prompt = 'Users have name and email';
      const result: ParsedModels = await service.parsePrompt(prompt);

      // Should fall back to basic parsing
      expect(result.models.length).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThan(0.5); // Fallback has low confidence
      expect(
        result.suggestions.some((s) =>
          s.message.includes('AI parsing unavailable')
        )
      ).toBe(true);
    });

    it('should handle blog post scenario', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'BlogPost',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                  required: true,
                  unique: false,
                },
                {
                  name: 'content',
                  type: 'text',
                  required: true,
                  unique: false,
                },
                {
                  name: 'published',
                  type: 'boolean',
                  required: false,
                  unique: false,
                },
                {
                  name: 'createdAt',
                  type: 'date',
                  required: true,
                  unique: false,
                },
              ],
            },
            {
              name: 'User',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
                { name: 'email', type: 'email', required: true, unique: true },
              ],
            },
          ],
          relationships: [
            {
              sourceModel: 'User',
              targetModel: 'BlogPost',
              type: 'oneToMany',
              description: 'User can write many blog posts',
            },
          ],
          confidence: 0.9,
          ambiguities: [],
        },
      });

      const prompt =
        'Blog posts have title, content, published status, and creation date. Users can write many blog posts.';
      const result: ParsedModels = await service.parsePrompt(prompt);

      expect(result.models).toHaveLength(2);

      const postModel = result.models.find((m) => m.name === 'BlogPost');
      const userModel = result.models.find((m) => m.name === 'User');

      expect(postModel).toBeDefined();
      expect(userModel).toBeDefined();

      // Check post fields
      expect(postModel?.fields.some((f) => f.name === 'title')).toBe(true);
      expect(postModel?.fields.some((f) => f.name === 'content')).toBe(true);
      expect(
        postModel?.fields.some(
          (f) => f.name === 'published' && f.type === 'boolean'
        )
      ).toBe(true);
      expect(
        postModel?.fields.some(
          (f) => f.name === 'createdAt' && f.type === 'date'
        )
      ).toBe(true);
    });
  });

  describe('validateModels', () => {
    it('should validate models successfully', () => {
      const validModels: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'id',
              type: 'uuid',
              required: true,
              unique: true,
              validation: [],
            },
            {
              id: '2',
              name: 'email',
              type: 'email',
              required: true,
              unique: true,
              validation: [],
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result: ValidationResult = service.validateModels(validModels);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate model names', () => {
      const modelsWithDuplicates: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'User',
          fields: [],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result: ValidationResult =
        service.validateModels(modelsWithDuplicates);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === 'DUPLICATE_MODEL_NAMES')
      ).toBe(true);
    });

    it('should detect duplicate field names within a model', () => {
      const modelsWithDuplicateFields: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'name',
              type: 'string',
              required: false,
              unique: false,
              validation: [],
            },
            {
              id: '2',
              name: 'name',
              type: 'string',
              required: false,
              unique: false,
              validation: [],
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result: ValidationResult = service.validateModels(
        modelsWithDuplicateFields
      );
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === 'DUPLICATE_FIELD_NAMES')
      ).toBe(true);
    });

    it('should detect invalid relationship targets', () => {
      const modelsWithInvalidRelationships: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [],
          relationships: [
            {
              id: '1',
              type: 'oneToMany',
              sourceModel: 'User',
              targetModel: 'NonExistentModel',
              sourceField: 'id',
              targetField: 'userId',
              cascadeDelete: false,
            },
          ],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result: ValidationResult = service.validateModels(
        modelsWithInvalidRelationships
      );
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === 'INVALID_RELATIONSHIP_TARGET')
      ).toBe(true);
    });

    it('should warn about empty models', () => {
      const emptyModels: Model[] = [
        {
          id: '1',
          name: 'EmptyModel',
          fields: [],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result: ValidationResult = service.validateModels(emptyModels);
      expect(result.isValid).toBe(true); // Empty models are valid but generate warnings
      expect(result.warnings.some((w) => w.code === 'EMPTY_MODEL')).toBe(true);
    });
  });

  describe('suggestImprovements', () => {
    it('should suggest adding ID field when missing', () => {
      const modelsWithoutId: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'name',
              type: 'string',
              required: false,
              unique: false,
              validation: [],
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const suggestions = service.suggestImprovements(modelsWithoutId);
      expect(suggestions.some((s) => s.message.includes('ID field'))).toBe(
        true
      );
    });

    it('should suggest adding timestamp fields when timestamps are enabled', () => {
      const modelsWithoutTimestamps: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'id',
              type: 'uuid',
              required: true,
              unique: true,
              validation: [],
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const suggestions = service.suggestImprovements(modelsWithoutTimestamps);
      expect(suggestions.some((s) => s.message.includes('createdAt'))).toBe(
        true
      );
      expect(suggestions.some((s) => s.message.includes('updatedAt'))).toBe(
        true
      );
    });

    it('should suggest validation for email fields', () => {
      const modelsWithEmailField: Model[] = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'email',
              type: 'email',
              required: true,
              unique: true,
              validation: [], // No validation rules
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const suggestions = service.suggestImprovements(modelsWithEmailField);
      expect(
        suggestions.some((s) => s.message.includes('email validation'))
      ).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle AI timeout gracefully', async () => {
      mockGenerateObject.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      const prompt = 'Users have name and email';
      const result: ParsedModels = await service.parsePrompt(prompt);

      // Should fall back to basic parsing
      expect(result.confidence).toBeLessThan(0.5);
      expect(
        result.suggestions.some((s) =>
          s.message.includes('AI parsing unavailable')
        )
      ).toBe(true);
    });

    it('should handle malformed AI responses', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: null, // Malformed response
          relationships: [],
          confidence: 0.8,
          ambiguities: [],
        },
      });

      const prompt = 'Users have name and email';
      const result: ParsedModels = await service.parsePrompt(prompt);

      // Should handle gracefully and fall back
      expect(result.models).toBeDefined();
      expect(Array.isArray(result.models)).toBe(true);
    });

    it('should handle very long prompts', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          models: [
            {
              name: 'User',
              fields: [
                { name: 'name', type: 'string', required: true, unique: false },
              ],
            },
          ],
          relationships: [],
          confidence: 0.7,
          ambiguities: [],
        },
      });

      const longPrompt =
        'Users have name and email. '.repeat(100) +
        'Products have name and price.';
      const result: ParsedModels = await service.parsePrompt(longPrompt);

      expect(result.models.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
