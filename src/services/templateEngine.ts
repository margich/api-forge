import { GenerationOptions, Model } from '../types';

export interface TemplateContext {
  models: Model[];
  options: GenerationOptions;
  model?: Model;
  [key: string]: any;
}

export class TemplateEngine {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadTemplates();
  }

  /**
   * Render a template with the given context
   */
  render(templateName: string, context: TemplateContext): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return this.processTemplate(template, context);
  }

  /**
   * Process template with context variables
   */
  private processTemplate(template: string, context: TemplateContext): string {
    let result = template;

    // Replace simple variables: {{variable}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return context[variable] || match;
    });

    // Replace nested variables: {{object.property}}
    result = result.replace(
      /\{\{(\w+)\.(\w+)\}\}/g,
      (match, object, property) => {
        const obj = context[object];
        return (obj && obj[property]) || match;
      }
    );

    // Process conditionals: {{#if condition}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        return context[condition] ? content : '';
      }
    );

    // Process loops: {{#each array}}...{{/each}}
    result = result.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayName, content) => {
        const array = context[arrayName];
        if (!Array.isArray(array)) {
          return '';
        }

        return array
          .map((item) => {
            const itemContext = { ...context, this: item, ...item };
            return this.processTemplate(content, itemContext);
          })
          .join('');
      }
    );

    return result;
  }

  /**
   * Load predefined templates
   */
  private loadTemplates(): void {
    // Express controller template
    this.templates.set(
      'express-controller',
      `
import { Request, Response, NextFunction } from 'express';
import { {{modelName}}Service } from '../services/{{modelName}}Service';
import { Create{{modelName}}Request, Update{{modelName}}Request } from '../models/{{modelName}}';

export class {{modelName}}Controller {
  private {{modelNameLower}}Service: {{modelName}}Service;

  constructor() {
    this.{{modelNameLower}}Service = new {{modelName}}Service();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: Create{{modelName}}Request = req.body;
      const result = await this.{{modelNameLower}}Service.create(data);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.{{modelNameLower}}Service.getById(id);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: '{{modelName}} not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.{{modelNameLower}}Service.getAll(
        Number(page),
        Number(limit)
      );
      
      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: Math.ceil(result.total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: Update{{modelName}}Request = req.body;
      const result = await this.{{modelNameLower}}Service.update(id, data);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: '{{modelName}} not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.{{modelNameLower}}Service.delete(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: '{{modelName}} not found'
        });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
`
    );

    // Model interface template
    this.templates.set(
      'model-interface',
      `
export interface {{modelName}} {
  id: string;
{{#each fields}}
  {{name}}{{#if required}}{{else}}?{{/if}}: {{tsType}};
{{/each}}
  createdAt: Date;
  updatedAt: Date;
}

export interface Create{{modelName}}Request {
{{#each createFields}}
  {{name}}{{#if required}}{{else}}?{{/if}}: {{tsType}};
{{/each}}
}

export interface Update{{modelName}}Request {
{{#each updateFields}}
  {{name}}?: {{tsType}};
{{/each}}
}
`
    );

    // PostgreSQL schema template
    this.templates.set(
      'postgresql-schema',
      `
CREATE TABLE {{tableName}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
{{#each fields}}
  {{name}} {{sqlType}}{{#if required}} NOT NULL{{/if}}{{#if unique}} UNIQUE{{/if}}{{#if defaultValue}} DEFAULT '{{defaultValue}}'{{/if}},
{{/each}}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_{{tableName}}_updated_at
  BEFORE UPDATE ON {{tableName}}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`
    );
  }

  /**
   * Add a custom template
   */
  addTemplate(name: string, template: string): void {
    this.templates.set(name, template);
  }

  /**
   * Get all available template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }
}
