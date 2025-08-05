// Repository exports
export * from './base.repository';
export * from './field.repository';
export * from './generated-code.repository';
export * from './model.repository';
export * from './project.repository';
export * from './relationship.repository';

// Repository instances (singletons)
import { FieldRepository } from './field.repository';
import { GeneratedCodeRepository } from './generated-code.repository';
import { ModelRepository } from './model.repository';
import { ProjectRepository } from './project.repository';
import { RelationshipRepository } from './relationship.repository';

export const projectRepository = new ProjectRepository();
export const modelRepository = new ModelRepository();
export const fieldRepository = new FieldRepository();
export const relationshipRepository = new RelationshipRepository();
export const generatedCodeRepository = new GeneratedCodeRepository();
