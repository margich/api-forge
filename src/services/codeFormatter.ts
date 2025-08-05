import { GeneratedFile } from '../types';

export interface FormattingOptions {
  indentSize: number;
  useTabs: boolean;
  semicolons: boolean;
  singleQuotes: boolean;
  trailingCommas: boolean;
}

export class CodeFormatter {
  private defaultOptions: FormattingOptions = {
    indentSize: 2,
    useTabs: false,
    semicolons: true,
    singleQuotes: true,
    trailingCommas: true,
  };

  /**
   * Format a generated file based on its language
   */
  formatFile(
    file: GeneratedFile,
    options?: Partial<FormattingOptions>
  ): GeneratedFile {
    const formatOptions = { ...this.defaultOptions, ...options };

    let formattedContent = file.content;

    switch (file.language) {
      case 'typescript':
      case 'javascript':
        formattedContent = this.formatTypeScript(file.content, formatOptions);
        break;
      case 'json':
        formattedContent = this.formatJSON(file.content, formatOptions);
        break;
      case 'sql':
        formattedContent = this.formatSQL(file.content);
        break;
      case 'markdown':
        formattedContent = this.formatMarkdown(file.content);
        break;
      default:
        // No formatting for unknown languages
        break;
    }

    return {
      ...file,
      content: formattedContent,
    };
  }

  /**
   * Format multiple files
   */
  formatFiles(
    files: GeneratedFile[],
    options?: Partial<FormattingOptions>
  ): GeneratedFile[] {
    return files.map((file) => this.formatFile(file, options));
  }

  /**
   * Format TypeScript/JavaScript code
   */
  private formatTypeScript(
    content: string,
    options: FormattingOptions
  ): string {
    let formatted = content;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Remove excessive blank lines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Fix indentation
    formatted = this.fixIndentation(formatted, options);

    // Handle semicolons
    if (options.semicolons) {
      formatted = this.addSemicolons(formatted);
    } else {
      formatted = this.removeSemicolons(formatted);
    }

    // Handle quotes
    if (options.singleQuotes) {
      formatted = this.convertToSingleQuotes(formatted);
    } else {
      formatted = this.convertToDoubleQuotes(formatted);
    }

    // Handle trailing commas
    if (options.trailingCommas) {
      formatted = this.addTrailingCommas(formatted);
    }

    // Clean up extra whitespace
    formatted = formatted.replace(/[ \t]+$/gm, ''); // Remove trailing whitespace
    formatted = formatted.replace(/^\s*\n/, ''); // Remove leading blank line
    formatted = formatted.replace(/\n\s*$/, '\n'); // Ensure single trailing newline

    return formatted;
  }

  /**
   * Format JSON content
   */
  private formatJSON(content: string, options: FormattingOptions): string {
    try {
      const parsed = JSON.parse(content);
      const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
      return JSON.stringify(parsed, null, indent) + '\n';
    } catch (error) {
      // Return original content if parsing fails
      return content;
    }
  }

  /**
   * Format SQL content
   */
  private formatSQL(content: string): string {
    let formatted = content;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Add proper spacing around keywords
    formatted = formatted.replace(
      /\b(CREATE|TABLE|INSERT|SELECT|FROM|WHERE|AND|OR|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET)\b/gi,
      (match) => match.toUpperCase()
    );

    // Ensure proper indentation for SQL blocks
    const lines = formatted.split('\n');
    const indentedLines = lines.map((line, index) => {
      const trimmed = line.trim();
      if (trimmed === '') return '';

      // Indent based on SQL structure
      if (trimmed.match(/^(CREATE|INSERT|SELECT|UPDATE|DELETE)/i)) {
        return trimmed;
      } else if (trimmed.match(/^(FROM|WHERE|ORDER|GROUP|HAVING|LIMIT)/i)) {
        return '  ' + trimmed;
      } else if (trimmed.match(/^(AND|OR)/i)) {
        return '    ' + trimmed;
      } else {
        return '  ' + trimmed;
      }
    });

    return indentedLines.join('\n') + '\n';
  }

  /**
   * Format Markdown content
   */
  private formatMarkdown(content: string): string {
    let formatted = content;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Ensure proper spacing around headers
    formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');

    // Ensure blank lines around code blocks
    formatted = formatted.replace(/```/g, '\n```\n');
    formatted = formatted.replace(/\n\n```\n/g, '\n\n```');
    formatted = formatted.replace(/\n```\n\n/g, '```\n\n');

    // Clean up excessive blank lines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Ensure single trailing newline
    formatted = formatted.replace(/\n\s*$/, '\n');

    return formatted;
  }

  /**
   * Fix indentation in code
   */
  private fixIndentation(content: string, options: FormattingOptions): string {
    const lines = content.split('\n');
    const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
    let indentLevel = 0;

    const indentedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return '';

      // Decrease indent for closing braces
      if (trimmed.match(/^[\}\]\)]/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = indent.repeat(indentLevel) + trimmed;

      // Increase indent for opening braces
      if (trimmed.match(/[\{\[\(]\s*$/)) {
        indentLevel++;
      }

      return indentedLine;
    });

    return indentedLines.join('\n');
  }

  /**
   * Add semicolons where needed
   */
  private addSemicolons(content: string): string {
    // Simple semicolon addition - in a real implementation, you'd use an AST
    return content.replace(
      /^(\s*(?:const|let|var|return|throw|break|continue|export|import).*[^;{}\s])$/gm,
      '$1;'
    );
  }

  /**
   * Remove semicolons
   */
  private removeSemicolons(content: string): string {
    return content.replace(/;(\s*$)/gm, '$1');
  }

  /**
   * Convert double quotes to single quotes
   */
  private convertToSingleQuotes(content: string): string {
    // Simple quote conversion - doesn't handle all edge cases
    return content.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");
  }

  /**
   * Convert single quotes to double quotes
   */
  private convertToDoubleQuotes(content: string): string {
    // Simple quote conversion - doesn't handle all edge cases
    return content.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
  }

  /**
   * Add trailing commas to objects and arrays
   */
  private addTrailingCommas(content: string): string {
    // Add trailing commas before closing braces/brackets
    return content.replace(/([^,\s])\s*\n(\s*[\}\]])/g, '$1,\n$2');
  }

  /**
   * Validate generated code syntax
   */
  validateCode(file: GeneratedFile): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (file.language) {
      case 'typescript':
      case 'javascript':
        return this.validateTypeScript(file.content);
      case 'json':
        return this.validateJSON(file.content);
      case 'sql':
        return this.validateSQL(file.content);
      default:
        return { isValid: true, errors: [] };
    }
  }

  /**
   * Validate TypeScript/JavaScript syntax
   */
  private validateTypeScript(content: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic syntax checks
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Mismatched braces');
    }

    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Mismatched parentheses');
    }

    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Mismatched brackets');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate JSON syntax
   */
  private validateJSON(content: string): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      JSON.parse(content);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Invalid JSON'],
      };
    }
  }

  /**
   * Validate SQL syntax (basic)
   */
  private validateSQL(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic SQL validation
    const statements = content.split(';').filter((s) => s.trim());

    for (const statement of statements) {
      const trimmed = statement.trim().toUpperCase();
      if (
        trimmed &&
        !trimmed.match(
          /^(CREATE|INSERT|SELECT|UPDATE|DELETE|DROP|ALTER|GRANT|REVOKE)/
        )
      ) {
        errors.push(`Invalid SQL statement: ${statement.substring(0, 50)}...`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
