import { beforeEach, describe, expect, it } from 'vitest';
import { GeneratedFile } from '../../types';
import { CodeFormatter, FormattingOptions } from '../codeFormatter';

describe('CodeFormatter', () => {
  let formatter: CodeFormatter;
  let defaultOptions: FormattingOptions;

  beforeEach(() => {
    formatter = new CodeFormatter();
    defaultOptions = {
      indentSize: 2,
      useTabs: false,
      semicolons: true,
      singleQuotes: true,
      trailingCommas: true,
    };
  });

  describe('formatFile', () => {
    it.skip('should format TypeScript files', () => {
      const file: GeneratedFile = {
        path: 'test.ts',
        content: `export class TestClass{
constructor(){
this.value=42
}
}`,
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);

      expect(result.content).toContain('export class TestClass {');
      expect(result.content).toContain('  constructor() {');
      expect(result.content).toContain('    this.value = 42;');
      expect(result.content).toContain('  }');
      expect(result.content).toContain('}');
    });

    it('should format JSON files', () => {
      const file: GeneratedFile = {
        path: 'package.json',
        content:
          '{"name":"test","version":"1.0.0","dependencies":{"express":"^4.18.0"}}',
        type: 'config',
        language: 'json',
      };

      const result = formatter.formatFile(file);
      const parsed = JSON.parse(result.content);

      expect(parsed.name).toBe('test');
      expect(parsed.version).toBe('1.0.0');
      expect(result.content).toContain('  "name": "test"');
      expect(result.content).toContain('  "version": "1.0.0"');
    });

    it.skip('should format SQL files', () => {
      const file: GeneratedFile = {
        path: 'schema.sql',
        content: `create table users(id uuid primary key,name varchar(255) not null,email varchar(255) unique);`,
        type: 'source',
        language: 'sql',
      };

      const result = formatter.formatFile(file);

      expect(result.content).toContain('CREATE TABLE users');
      expect(result.content).toContain('  id uuid primary key');
      expect(result.content).toContain('  name varchar(255) NOT NULL');
    });

    it('should format Markdown files', () => {
      const file: GeneratedFile = {
        path: 'README.md',
        content: `#Title\n\n\n\nSome content\n\n\`\`\`javascript\nconsole.log('test');\n\`\`\`\n\n\n`,
        type: 'documentation',
        language: 'markdown',
      };

      const result = formatter.formatFile(file);

      expect(result.content).toContain('# Title');
      expect(result.content).toContain('\n```javascript\n');
      expect(result.content).not.toContain('\n\n\n\n');
    });

    it('should handle unknown languages gracefully', () => {
      const file: GeneratedFile = {
        path: 'test.unknown',
        content: 'some content',
        type: 'source',
        language: 'unknown',
      };

      const result = formatter.formatFile(file);
      expect(result.content).toBe('some content');
    });
  });

  describe('formatFiles', () => {
    it.skip('should format multiple files', () => {
      const files: GeneratedFile[] = [
        {
          path: 'test1.ts',
          content: 'export class Test1{}',
          type: 'source',
          language: 'typescript',
        },
        {
          path: 'test2.ts',
          content: 'export class Test2{}',
          type: 'source',
          language: 'typescript',
        },
      ];

      const results = formatter.formatFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].content).toContain('export class Test1 {');
      expect(results[1].content).toContain('export class Test2 {');
    });
  });

  describe('TypeScript formatting options', () => {
    it.skip('should respect indentSize option', () => {
      const file: GeneratedFile = {
        path: 'test.ts',
        content: `class Test{
method(){
return true
}
}`,
        type: 'source',
        language: 'typescript',
      };

      const options = { ...defaultOptions, indentSize: 4 };
      const result = formatter.formatFile(file, options);

      expect(result.content).toContain('    method() {');
      expect(result.content).toContain('        return true;');
    });

    it.skip('should respect useTabs option', () => {
      const file: GeneratedFile = {
        path: 'test.ts',
        content: `class Test{
method(){
return true
}
}`,
        type: 'source',
        language: 'typescript',
      };

      const options = { ...defaultOptions, useTabs: true };
      const result = formatter.formatFile(file, options);

      expect(result.content).toContain('\tmethod() {');
      expect(result.content).toContain('\t\treturn true;');
    });

    it.skip('should handle semicolons option', () => {
      const file: GeneratedFile = {
        path: 'test.ts',
        content: `const value = 42
export default value`,
        type: 'source',
        language: 'typescript',
      };

      const withSemicolons = formatter.formatFile(file, {
        ...defaultOptions,
        semicolons: true,
      });
      const withoutSemicolons = formatter.formatFile(file, {
        ...defaultOptions,
        semicolons: false,
      });

      expect(withSemicolons.content).toContain('const value = 42;');
      expect(withSemicolons.content).toContain('export default value;');

      expect(withoutSemicolons.content).toContain('const value = 42\n');
      expect(withoutSemicolons.content).toContain('export default value\n');
    });

    it('should handle quotes option', () => {
      const file: GeneratedFile = {
        path: 'test.ts',
        content: `const message = "Hello World"
const name = "Test"`,
        type: 'source',
        language: 'typescript',
      };

      const singleQuotes = formatter.formatFile(file, {
        ...defaultOptions,
        singleQuotes: true,
      });
      const doubleQuotes = formatter.formatFile(file, {
        ...defaultOptions,
        singleQuotes: false,
      });

      expect(singleQuotes.content).toContain("const message = 'Hello World'");
      expect(doubleQuotes.content).toContain('const message = "Hello World"');
    });
  });

  describe('validateCode', () => {
    it('should validate TypeScript syntax', () => {
      const validFile: GeneratedFile = {
        path: 'valid.ts',
        content: 'export class Test { constructor() {} }',
        type: 'source',
        language: 'typescript',
      };

      const invalidFile: GeneratedFile = {
        path: 'invalid.ts',
        content: 'export class Test { constructor() {',
        type: 'source',
        language: 'typescript',
      };

      const validResult = formatter.validateCode(validFile);
      const invalidResult = formatter.validateCode(invalidFile);

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Mismatched braces');
    });

    it('should validate JSON syntax', () => {
      const validFile: GeneratedFile = {
        path: 'valid.json',
        content: '{"name": "test", "version": "1.0.0"}',
        type: 'config',
        language: 'json',
      };

      const invalidFile: GeneratedFile = {
        path: 'invalid.json',
        content: '{"name": "test", "version":}',
        type: 'config',
        language: 'json',
      };

      const validResult = formatter.validateCode(validFile);
      const invalidResult = formatter.validateCode(invalidFile);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should validate SQL syntax', () => {
      const validFile: GeneratedFile = {
        path: 'valid.sql',
        content:
          'CREATE TABLE users (id UUID PRIMARY KEY); SELECT * FROM users;',
        type: 'source',
        language: 'sql',
      };

      const invalidFile: GeneratedFile = {
        path: 'invalid.sql',
        content: 'INVALID STATEMENT; SELECT * FROM users;',
        type: 'source',
        language: 'sql',
      };

      const validResult = formatter.validateCode(validFile);
      const invalidResult = formatter.validateCode(invalidFile);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle unknown languages', () => {
      const file: GeneratedFile = {
        path: 'test.unknown',
        content: 'some content',
        type: 'source',
        language: 'unknown',
      };

      const result = formatter.validateCode(file);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it.skip('should handle empty files', () => {
      const file: GeneratedFile = {
        path: 'empty.ts',
        content: '',
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);
      expect(result.content).toBe('\n');
    });

    it('should handle files with only whitespace', () => {
      const file: GeneratedFile = {
        path: 'whitespace.ts',
        content: '   \n\n\t  \n   ',
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);
      expect(result.content.trim()).toBe('');
    });

    it('should handle malformed JSON gracefully', () => {
      const file: GeneratedFile = {
        path: 'malformed.json',
        content: '{"name": "test", invalid}',
        type: 'config',
        language: 'json',
      };

      const result = formatter.formatFile(file);
      expect(result.content).toBe('{"name": "test", invalid}'); // Should return original
    });

    it.skip('should handle complex nested structures', () => {
      const file: GeneratedFile = {
        path: 'complex.ts',
        content: `export class Complex{
private nested={
deeply:{
nested:{
value:42
}
}
}
method(){
if(true){
for(let i=0;i<10;i++){
console.log(i)
}
}
}
}`,
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);

      expect(result.content).toContain('export class Complex {');
      expect(result.content).toContain('  private nested = {');
      expect(result.content).toContain('    deeply: {');
      expect(result.content).toContain('      nested: {');
      expect(result.content).toContain('        value: 42,');
    });
  });

  describe('specific formatting rules', () => {
    it('should remove trailing whitespace', () => {
      const file: GeneratedFile = {
        path: 'trailing.ts',
        content: 'const value = 42;   \nconst other = 43;  \t\n',
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);
      expect(result.content).not.toMatch(/[ \t]+$/m);
    });

    it('should ensure single trailing newline', () => {
      const file: GeneratedFile = {
        path: 'newlines.ts',
        content: 'const value = 42;\n\n\n',
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);
      expect(result.content).toMatch(/[^\n]\n$/);
      expect(result.content).not.toMatch(/\n\n$/);
    });

    it('should remove excessive blank lines', () => {
      const file: GeneratedFile = {
        path: 'blank-lines.ts',
        content: 'const a = 1;\n\n\n\nconst b = 2;\n\n\n\nconst c = 3;',
        type: 'source',
        language: 'typescript',
      };

      const result = formatter.formatFile(file);
      expect(result.content).not.toMatch(/\n\s*\n\s*\n/);
      expect(result.content).toMatch(
        /const a = 1;\n\nconst b = 2;\n\nconst c = 3;/
      );
    });
  });
});
