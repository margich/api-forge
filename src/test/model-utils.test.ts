import { beforeEach, describe, expect, it } from 'vitest';
import {
  addFieldToModel,
  addRelationshipToModel,
  createField,
  createModel,
  createRelationship,
  getDefaultValueForFieldType,
  getRelatedModels,
  isValidFieldName,
  isValidModelName,
  modelNameToTableName,
  removeFieldFromModel,
  removeRelationshipFromModel,
  updateFieldInModel,
  updateRelationshipInModel,
  validateField,
  validateModel,
  validateModelRelationships,
  validateRelationship,
} from '../lib/model-utils';
import { Field, Model, Relationship } from '../types/models';

describe('Model Utils', () => {
  describe('createModel', () => {
    it('should create a model with default values', () => {
      const model = createModel('User', 'A user model');

      expect(model.name).toBe('User');
      expect(model.metadata.description).toBe('A user model');
      expect(model.fields).toEqual([]);
      expect(model.relationships).toEqual([]);
      expect(model.metadata.timestamps).toBe(true);
      expect(model.metadata.softDelete).toBe(false);
      expect(model.id).toBeDefined();
      expect(model.createdAt).toBeInstanceOf(Date);
      expect(model.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a model without description', () => {
      const model = createModel('Product');

      expect(model.name).toBe('Product');
      expect(model.metadata.description).toBeUndefined();
    });
  });

  describe('createField', () => {
    it('should create a field with default values', () => {
      const field = createField('email', 'email');

      expect(field.name).toBe('email');
      expect(field.type).toBe('email');
      expect(field.required).toBe(false);
      expect(field.unique).toBe(false);
      expect(field.validation).toEqual([]);
      expect(field.id).toBeDefined();
    });

    it('should create a field with custom options', () => {
      const field = createField('username', 'string', {
        required: true,
        unique: true,
        description: 'User login name',
      });

      expect(field.required).toBe(true);
      expect(field.unique).toBe(true);
      expect(field.description).toBe('User login name');
    });
  });

  describe('createRelationship', () => {
    it('should create a relationship with default values', () => {
      const relationship = createRelationship(
        'oneToMany',
        'User',
        'Post',
        'id',
        'userId'
      );

      expect(relationship.type).toBe('oneToMany');
      expect(relationship.sourceModel).toBe('User');
      expect(relationship.targetModel).toBe('Post');
      expect(relationship.sourceField).toBe('id');
      expect(relationship.targetField).toBe('userId');
      expect(relationship.cascadeDelete).toBe(false);
      expect(relationship.id).toBeDefined();
    });

    it('should create a relationship with cascade delete', () => {
      const relationship = createRelationship(
        'oneToOne',
        'User',
        'Profile',
        'id',
        'userId',
        true
      );

      expect(relationship.cascadeDelete).toBe(true);
    });
  });

  describe('validateModel', () => {
    it('should validate a correct model', () => {
      const model = createModel('User');
      const result = validateModel(model);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate a model with missing required fields', () => {
      const invalidModel = {
        id: 'invalid-uuid',
        name: '',
        fields: [],
      };

      const result = validateModel(invalidModel);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateField', () => {
    it('should validate a correct field', () => {
      const field = createField('name', 'string');
      const result = validateField(field);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate a field with invalid type', () => {
      const invalidField = {
        id: 'invalid-uuid',
        name: 'test',
        type: 'invalid-type',
      };

      const result = validateField(invalidField);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRelationship', () => {
    it('should validate a correct relationship', () => {
      const relationship = createRelationship(
        'oneToMany',
        'User',
        'Post',
        'id',
        'userId'
      );
      const result = validateRelationship(relationship);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate a relationship with invalid type', () => {
      const invalidRelationship = {
        id: 'invalid-uuid',
        type: 'invalid-type',
        sourceModel: 'User',
        targetModel: 'Post',
        sourceField: 'id',
        targetField: 'userId',
      };

      const result = validateRelationship(invalidRelationship);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateModelRelationships', () => {
    let userModel: Model;
    let postModel: Model;

    beforeEach(() => {
      userModel = createModel('User');
      userModel = addFieldToModel(userModel, createField('id', 'uuid'));
      userModel = addFieldToModel(userModel, createField('name', 'string'));

      postModel = createModel('Post');
      postModel = addFieldToModel(postModel, createField('id', 'uuid'));
      postModel = addFieldToModel(postModel, createField('userId', 'uuid'));
      postModel = addFieldToModel(postModel, createField('title', 'string'));
    });

    it('should validate models with correct relationships', () => {
      const relationship = createRelationship(
        'oneToMany',
        'User',
        'Post',
        'id',
        'userId'
      );
      userModel = addRelationshipToModel(userModel, relationship);

      const result = validateModelRelationships([userModel, postModel]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate models with non-existent target model', () => {
      const relationship = createRelationship(
        'oneToMany',
        'User',
        'NonExistent',
        'id',
        'userId'
      );
      userModel = addRelationshipToModel(userModel, relationship);

      const result = validateModelRelationships([userModel, postModel]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_TARGET_MODEL')).toBe(
        true
      );
    });

    it('should invalidate models with non-existent source field', () => {
      const relationship = createRelationship(
        'oneToMany',
        'User',
        'Post',
        'nonExistentField',
        'userId'
      );
      userModel = addRelationshipToModel(userModel, relationship);

      const result = validateModelRelationships([userModel, postModel]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SOURCE_FIELD')).toBe(
        true
      );
    });

    it('should invalidate models with duplicate field names', () => {
      userModel = addFieldToModel(userModel, createField('name', 'string')); // Duplicate

      const result = validateModelRelationships([userModel, postModel]);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === 'DUPLICATE_FIELD_NAMES')
      ).toBe(true);
    });

    it('should invalidate models with duplicate model names', () => {
      const duplicateModel = createModel('User');

      const result = validateModelRelationships([
        userModel,
        postModel,
        duplicateModel,
      ]);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === 'DUPLICATE_MODEL_NAMES')
      ).toBe(true);
    });
  });

  describe('Model manipulation functions', () => {
    let model: Model;
    let field: Field;
    let relationship: Relationship;

    beforeEach(() => {
      model = createModel('User');
      field = createField('name', 'string');
      relationship = createRelationship(
        'oneToMany',
        'User',
        'Post',
        'id',
        'userId'
      );
    });

    describe('addFieldToModel', () => {
      it('should add a field to a model', () => {
        const updatedModel = addFieldToModel(model, field);

        expect(updatedModel.fields).toHaveLength(1);
        expect(updatedModel.fields[0]).toEqual(field);
        expect(updatedModel.updatedAt.getTime()).toBeGreaterThanOrEqual(
          model.updatedAt.getTime()
        );
      });
    });

    describe('updateFieldInModel', () => {
      it('should update a field in a model', () => {
        let updatedModel = addFieldToModel(model, field);
        updatedModel = updateFieldInModel(updatedModel, field.id, {
          required: true,
        });

        expect(updatedModel.fields[0].required).toBe(true);
        expect(updatedModel.fields[0].name).toBe('name'); // Other properties unchanged
      });
    });

    describe('removeFieldFromModel', () => {
      it('should remove a field from a model', () => {
        let updatedModel = addFieldToModel(model, field);
        updatedModel = removeFieldFromModel(updatedModel, field.id);

        expect(updatedModel.fields).toHaveLength(0);
      });
    });

    describe('addRelationshipToModel', () => {
      it('should add a relationship to a model', () => {
        const updatedModel = addRelationshipToModel(model, relationship);

        expect(updatedModel.relationships).toHaveLength(1);
        expect(updatedModel.relationships[0]).toEqual(relationship);
      });
    });

    describe('updateRelationshipInModel', () => {
      it('should update a relationship in a model', () => {
        let updatedModel = addRelationshipToModel(model, relationship);
        updatedModel = updateRelationshipInModel(
          updatedModel,
          relationship.id,
          { cascadeDelete: true }
        );

        expect(updatedModel.relationships[0].cascadeDelete).toBe(true);
      });
    });

    describe('removeRelationshipFromModel', () => {
      it('should remove a relationship from a model', () => {
        let updatedModel = addRelationshipToModel(model, relationship);
        updatedModel = removeRelationshipFromModel(
          updatedModel,
          relationship.id
        );

        expect(updatedModel.relationships).toHaveLength(0);
      });
    });
  });

  describe('getRelatedModels', () => {
    it('should find models with relationships to the given model', () => {
      const userModel = createModel('User');
      const postModel = createModel('Post');
      const commentModel = createModel('Comment');

      const userPostRelationship = createRelationship(
        'oneToMany',
        'User',
        'Post',
        'id',
        'userId'
      );
      const postCommentRelationship = createRelationship(
        'oneToMany',
        'Post',
        'Comment',
        'id',
        'postId'
      );

      const updatedPostModel = addRelationshipToModel(
        postModel,
        userPostRelationship
      );
      const updatedCommentModel = addRelationshipToModel(
        commentModel,
        postCommentRelationship
      );

      const models = [userModel, updatedPostModel, updatedCommentModel];
      const relatedToUser = getRelatedModels(models, 'User');

      expect(relatedToUser).toHaveLength(1);
      expect(relatedToUser[0].name).toBe('Post');
    });
  });

  describe('Validation functions', () => {
    describe('isValidFieldName', () => {
      it('should validate correct field names', () => {
        expect(isValidFieldName('name')).toBe(true);
        expect(isValidFieldName('firstName')).toBe(true);
        expect(isValidFieldName('user_id')).toBe(true);
        expect(isValidFieldName('field123')).toBe(true);
      });

      it('should invalidate incorrect field names', () => {
        expect(isValidFieldName('123field')).toBe(false);
        expect(isValidFieldName('field-name')).toBe(false);
        expect(isValidFieldName('field name')).toBe(false);
        expect(isValidFieldName('')).toBe(false);
      });
    });

    describe('isValidModelName', () => {
      it('should validate correct model names', () => {
        expect(isValidModelName('User')).toBe(true);
        expect(isValidModelName('UserProfile')).toBe(true);
        expect(isValidModelName('Model123')).toBe(true);
      });

      it('should invalidate incorrect model names', () => {
        expect(isValidModelName('user')).toBe(false);
        expect(isValidModelName('123Model')).toBe(false);
        expect(isValidModelName('User-Model')).toBe(false);
        expect(isValidModelName('User Model')).toBe(false);
        expect(isValidModelName('')).toBe(false);
      });
    });

    describe('modelNameToTableName', () => {
      it('should convert model names to table names', () => {
        expect(modelNameToTableName('User')).toBe('users');
        expect(modelNameToTableName('UserProfile')).toBe('user_profiles');
        expect(modelNameToTableName('BlogPost')).toBe('blog_posts');
      });
    });

    describe('getDefaultValueForFieldType', () => {
      it('should return correct default values for field types', () => {
        expect(getDefaultValueForFieldType('string')).toBe('');
        expect(getDefaultValueForFieldType('number')).toBe(0);
        expect(getDefaultValueForFieldType('boolean')).toBe(false);
        expect(getDefaultValueForFieldType('date')).toBeInstanceOf(Date);
        expect(getDefaultValueForFieldType('json')).toEqual({});
      });
    });
  });
});
