export interface Category {
  name: string;
  subcategories: string[];
}

export const CATEGORIES: Record<string, Category> = {
  Frontend: {
    name: "Frontend",
    subcategories: [
      "UI Component Generation",
      "Style Optimization", 
      "Performance Tuning",
      "Accessibility Enhancement"
    ]
  },
  Backend: {
    name: "Backend",
    subcategories: [
      "API Development",
      "Code Analysis",
      "Architecture Design",
      "Service Integration"
    ]
  },
  Testing: {
    name: "Testing",
    subcategories: [
      "Test Generation",
      "Test Data Creation",
      "Performance Testing",
      "End-to-End Testing"
    ]
  },
  DevOps: {
    name: "DevOps",
    subcategories: [
      "Pipeline Automation",
      "Infrastructure Automation",
      "Infrastructure as Code",
      "Release Management",
      "Data Migration"
    ]
  },
  Database: {
    name: "Database",
    subcategories: [
      "Schema Design",
      "Query Optimization",
      "Data Migration",
      "Indexing Strategy"
    ]
  },
  Security: {
    name: "Security",
    subcategories: [
      "Code Security",
      "Vulnerability Assessment",
      "Dependency Analysis",
      "Compliance Review"
    ]
  },
  "Code Quality": {
    name: "Code Quality",
    subcategories: [
      "Code Optimization",
      "Code Analysis",
      "Performance Tuning",
      "Code Smell Detection"
    ]
  },
  Monitoring: {
    name: "Monitoring",
    subcategories: [
      "Log Analysis",
      "System Monitoring",
      "Metrics Collection",
      "Alert Management"
    ]
  },
  Documentation: {
    name: "Documentation",
    subcategories: [
      "Auto Documentation",
      "API Documentation",
      "Code Comments",
      "Architecture Docs"
    ]
  },
  Product: {
    name: "Product",
    subcategories: [
      "Requirement Analysis",
      "Feature Planning",
      "User Story Generation",
      "Specification Writing"
    ]
  }
};

export const ALL_CATEGORIES = Object.keys(CATEGORIES);
export const ALL_SUBCATEGORIES = Object.values(CATEGORIES).flatMap(cat => cat.subcategories);

export interface SkillCategorization {
  category: string;
  subcategory: string;
}

export class GrokCategorizer {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1';
  private models: string[] = ['grok-3', 'grok-2'];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async categorizeSkill(
    name: string,
    description: string,
    technologies: string[] = [],
    tasks: Array<{name: string, description: string}> = []
  ): Promise<SkillCategorization> {
    const prompt = this.buildCategorizationPrompt(name, description, technologies, tasks);
    
    console.log('GROK API Key exists:', !!this.apiKey);
    console.log('GROK API Key length:', this.apiKey?.length || 0);
    
    // Try each model in order
    for (const model of this.models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const requestBody = {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert software categorization AI. Analyze skills and assign them to the most appropriate category and subcategory. Respond only with a JSON object containing category and subcategory.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        };

        console.log(`GROK Request URL: ${this.baseUrl}/chat/completions`);
        console.log(`GROK Request body for model ${model}:`, JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`GROK Response status for model ${model}:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`GROK API error response for model ${model}:`, errorText);
          if (errorText.includes('Model not found')) {
            console.log(`Model ${model} not found, trying next model...`);
            continue; // Try next model
          }
          throw new Error(`GROK API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`GROK Response data for model ${model}:`, JSON.stringify(data, null, 2));
        
        const result = JSON.parse(data.choices[0].message.content);
        
        return {
          category: result.category || 'Code Quality',
          subcategory: result.subcategory || 'Code Analysis'
        };
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        // Continue to next model if this one failed
        continue;
      }
    }

    // All models failed, use fallback
    console.error('All GROK models failed, using fallback categorization');
    return this.fallbackCategorization(name, description, technologies);
  }

  private buildCategorizationPrompt(
    name: string,
    description: string,
    technologies: string[],
    tasks: Array<{name: string, description: string}>
  ): string {
    const categoriesList = Object.entries(CATEGORIES)
      .map(([key, cat]) => `${key}: ${cat.subcategories.join(', ')}`)
      .join('\n');

    return `
Analyze this skill and categorize it:

Skill Name: ${name}
Description: ${description}
Technologies: ${technologies.join(', ') || 'None specified'}
Tasks: ${tasks.map(t => `${t.name}: ${t.description}`).join('\n') || 'None specified'}

Available Categories and Subcategories:
${categoriesList}

Return a JSON object with:
{
  "category": "exact category name from above",
  "subcategory": "exact subcategory name from the category"
}

Choose the most appropriate category based on what the skill actually does, not just technologies used.
    `.trim();
  }

  private fallbackCategorization(
    name: string,
    description: string,
    technologies: string[]
  ): SkillCategorization {
    const text = `${name} ${description} ${technologies.join(' ')}`.toLowerCase();
    
    if (text.includes('frontend') || text.includes('ui') || text.includes('react') || text.includes('vue') || text.includes('angular')) {
      return {
        category: 'Frontend',
        subcategory: 'UI Component Generation'
      };
    }
    
    if (text.includes('api') || text.includes('backend') || text.includes('server') || text.includes('database')) {
      return {
        category: 'Backend',
        subcategory: 'API Development'
      };
    }
    
    if (text.includes('test') || text.includes('testing') || text.includes('spec')) {
      return {
        category: 'Testing',
        subcategory: 'Test Generation'
      };
    }
    
    if (text.includes('security') || text.includes('vulnerability') || text.includes('auth')) {
      return {
        category: 'Security',
        subcategory: 'Code Security'
      };
    }
    
    if (text.includes('deploy') || text.includes('devops') || text.includes('cicd') || text.includes('pipeline')) {
      return {
        category: 'DevOps',
        subcategory: 'Pipeline Automation'
      };
    }
    
    return {
      category: 'Code Quality',
      subcategory: 'Code Analysis'
    };
  }
}

// Google Gemini Free Alternative
export class GeminiCategorizer {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1';
  private model: string = 'gemini-2.5-flash-lite'; // Working model

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async categorizeSkill(
    name: string,
    description: string,
    technologies: string[] = [],
    tasks: Array<{name: string, description: string}> = []
  ): Promise<SkillCategorization> {
    const prompt = this.buildCategorizationPrompt(name, description, technologies, tasks);
    
    try {
      console.log('Gemini API Key exists:', !!this.apiKey);
      console.log('Using Gemini model:', this.model);
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `You are an expert software categorization AI. Analyze skills and assign them to the most appropriate category and subcategory. Respond only with a JSON object containing category and subcategory.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150,
        }
      };

      console.log('Gemini Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Gemini Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini Response data:', JSON.stringify(data, null, 2));
      
      const content = data.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No content in Gemini response');
      }
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      return {
        category: result.category || 'Code Quality',
        subcategory: result.subcategory || 'Code Analysis'
      };
    } catch (error) {
      console.error('Error categorizing skill with Gemini:', error);
      return this.fallbackCategorization(name, description, technologies);
    }
  }

  private buildCategorizationPrompt(
    name: string,
    description: string,
    technologies: string[],
    tasks: Array<{name: string, description: string}>
  ): string {
    const categoriesList = Object.entries(CATEGORIES)
      .map(([key, cat]) => `${key}: ${cat.subcategories.join(', ')}`)
      .join('\n');

    return `
Analyze this skill and categorize it:

Skill Name: ${name}
Description: ${description}
Technologies: ${technologies.join(', ') || 'None specified'}
Tasks: ${tasks.map(t => `${t.name}: ${t.description}`).join('\n') || 'None specified'}

Available Categories and Subcategories:
${categoriesList}

Return a JSON object with:
{
  "category": "exact category name from above",
  "subcategory": "exact subcategory name from the category"
}

Choose the most appropriate category based on what the skill actually does, not just technologies used.
    `.trim();
  }

  private fallbackCategorization(
    name: string,
    description: string,
    technologies: string[]
  ): SkillCategorization {
    const text = `${name} ${description} ${technologies.join(' ')}`.toLowerCase();
    
    if (text.includes('frontend') || text.includes('ui') || text.includes('react') || text.includes('vue') || text.includes('angular')) {
      return {
        category: 'Frontend',
        subcategory: 'UI Component Generation'
      };
    }
    
    if (text.includes('api') || text.includes('backend') || text.includes('server') || text.includes('database')) {
      return {
        category: 'Backend',
        subcategory: 'API Development'
      };
    }
    
    if (text.includes('test') || text.includes('testing') || text.includes('spec')) {
      return {
        category: 'Testing',
        subcategory: 'Test Generation'
      };
    }
    
    if (text.includes('security') || text.includes('vulnerability') || text.includes('auth')) {
      return {
        category: 'Security',
        subcategory: 'Code Security'
      };
    }
    
    if (text.includes('deploy') || text.includes('devops') || text.includes('cicd') || text.includes('pipeline')) {
      return {
        category: 'DevOps',
        subcategory: 'Pipeline Automation'
      };
    }
    
    return {
      category: 'Code Quality',
      subcategory: 'Code Analysis'
    };
  }
}

export function createCategorizer(): GrokCategorizer | GeminiCategorizer {
  // Try GROK first, then Gemini
  const grokApiKey = process.env.GROK_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (grokApiKey) {
    console.log('Using GROK categorizer');
    return new GrokCategorizer(grokApiKey);
  }
  
  if (geminiApiKey) {
    console.log('Using Gemini categorizer');
    return new GeminiCategorizer(geminiApiKey);
  }
  
  // If neither API key is available, throw error
  throw new Error('Either GROK_API_KEY or GEMINI_API_KEY environment variable is required');
}
