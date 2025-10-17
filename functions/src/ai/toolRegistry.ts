/**
 * Tool Registry
 * Manages AI tools/functions that OpenAI can call
 * PR-30: Task 1.3
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any, context: any) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Tool Registry Class
 * Manages registration and execution of AI tools
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Convert tools to OpenAI function format
   */
  toOpenAIFunctions(): any[] {
    return this.list().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Validate tool parameters against schema
   */
  validateParameters(toolName: string, params: any): { valid: boolean; errors: string[] } {
    const tool = this.get(toolName);
    if (!tool) {
      return { valid: false, errors: [`Tool "${toolName}" not found`] };
    }

    const errors: string[] = [];
    const schema = tool.parameters;

    // Check required parameters
    if (schema.required) {
      for (const required of schema.required) {
        if (params[required] === undefined) {
          errors.push(`Missing required parameter: ${required}`);
        }
      }
    }

    // Validate parameter types (basic validation)
    for (const [key, value] of Object.entries(params)) {
      const propSchema = schema.properties[key];
      if (!propSchema) {
        errors.push(`Unknown parameter: ${key}`);
        continue;
      }

      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (propSchema.type && propSchema.type !== actualType) {
        errors.push(`Parameter "${key}" must be of type ${propSchema.type}, got ${actualType}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

