# MCP Server Development Best Practices Guide
## A Comprehensive Guide for Building Production-Ready Model Context Protocol Servers

**Version:** 1.0.0  
**Last Updated:** March 2024  
**Target Audience:** Developers, Solution Architects, Technical Leads  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Best Practice #1: Use Descriptive Tool Names](#best-practice-1-use-descriptive-tool-names-that-match-user-intent)
3. [Best Practice #2: Provide Rich Parameter Descriptions](#best-practice-2-provide-rich-parameter-descriptions-with-examples)
4. [Best Practice #3: Break Complex APIs into Focused Tools](#best-practice-3-break-complex-apis-into-focused-single-purpose-tools)
5. [Best Practice #4: Include Context Prompts](#best-practice-4-include-context-prompts-to-guide-the-ai)
6. [Best Practice #5: Transform API Responses](#best-practice-5-transform-api-responses-into-ai-friendly-formats)
7. [Best Practice #6: Handle Errors Gracefully](#best-practice-6-handle-errors-gracefully-with-actionable-guidance)
8. [Best Practice #7: Implement Parameter Validation](#best-practice-7-implement-parameter-validation-before-api-calls)
9. [Best Practice #8: Cache Results for Refinement](#best-practice-8-cache-results-when-appropriate-for-refinement)
10. [Best Practice #9: Document Field Mappings](#best-practice-9-document-field-mappings-as-mcp-resources)
11. [Best Practice #10: Test with Real User Queries](#best-practice-10-test-with-real-user-queries-to-ensure-proper-mapping)
12. [Quick Reference Guide](#quick-reference-guide)
13. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
14. [Implementation Checklist](#implementation-checklist)

---

## Introduction

The Model Context Protocol (MCP) enables AI assistants to interact with external systems through well-defined interfaces. When building MCP servers that integrate with REST APIs, following best practices ensures reliable, maintainable, and user-friendly implementations.

This guide presents 10 essential best practices developed through extensive experience building production MCP servers. Each practice includes detailed explanations, code examples, and common pitfalls to avoid.

### Core Principles

1. **User-Centric Design**: Tools should map to how users think, not API structure
2. **Fail Gracefully**: Errors should guide users to solutions
3. **Performance Matters**: Optimize for responsiveness through caching and validation
4. **Documentation is Code**: Treat mappings and context as first-class citizens
5. **Test with Reality**: Use actual user queries, not theoretical test cases

---

## Best Practice #1: Use Descriptive Tool Names That Match User Intent

### Why This Matters
Tool names are the primary interface between Claude and your API. They directly influence how well Claude can match user requests to the right API endpoint. Poor naming leads to incorrect tool selection, failed requests, and frustrated users.

### Implementation Details

#### Naming Convention Strategy

```typescript
// ❌ BAD: Vague, technical, or ambiguous names
server.tool({
  name: 'api_call_1',
  name: 'getData',
  name: 'process',
  name: 'crud_operation'
});

// ✅ GOOD: Action-oriented, specific, intuitive names
server.tool({
  name: 'search_products_by_criteria',
  name: 'calculate_shipping_cost',
  name: 'check_inventory_availability',
  name: 'schedule_delivery_appointment'
});
```

#### Naming Pattern Formula

**Pattern:** `[action]_[target]_[qualifier]`

Examples:
- `create_customer_account` - action: create, target: customer account
- `update_order_status` - action: update, target: order, qualifier: status
- `list_recent_transactions` - action: list, target: transactions, qualifier: recent
- `calculate_tax_amount` - action: calculate, target: tax amount
- `validate_discount_code` - action: validate, target: discount code

#### Multi-Language Consideration

```typescript
server.tool({
  name: 'search_products',
  // Include aliases and synonyms in description
  description: 'Search for products (also: find items, lookup merchandise, browse catalog)',
  alternateNames: ['find_products', 'lookup_items', 'browse_products'], // For internal mapping
  handler: async (params) => {
    // Implementation
  }
});
```

#### Hierarchical Naming for Complex Systems

Use prefixes to group related functionality:

```typescript
// Inventory management tools
'inventory_check_stock'
'inventory_update_quantity'
'inventory_reserve_items'
'inventory_release_reservation'

// Payment processing tools
'payment_process_card'
'payment_validate_account'
'payment_refund_transaction'
'payment_check_status'
```

### Best Practices Summary

✅ **DO:**
- Use action verbs (search, create, update, delete, calculate)
- Be specific about the target (product, not item)
- Keep names 2-4 words long
- Use consistent naming patterns
- Consider international variations

❌ **DON'T:**
- Use generic names (process, handle, manage)
- Include version numbers in names
- Use internal jargon or abbreviations
- Create overly long names
- Mix naming conventions

### Common Pitfalls
1. **Using generic names** like "process" or "handle"
2. **Including version numbers** in tool names (use description for versioning)
3. **Using internal jargon** or abbreviations
4. **Making names too long** (aim for 2-4 words)
5. **Inconsistent naming patterns** across tools

---

## Best Practice #2: Provide Rich Parameter Descriptions with Examples

### Why This Matters
Parameter descriptions act as documentation that Claude uses to understand how to properly format and populate API calls. Without clear descriptions and examples, Claude may pass incorrect data types, formats, or values.

### Implementation Details

#### Comprehensive Parameter Documentation

```typescript
server.tool({
  name: 'create_invoice',
  description: 'Create a new invoice for a customer with line items and payment terms',
  parameters: z.object({
    customerId: z.string()
      .describe('Customer ID in format CUST-XXXXX (e.g., CUST-12345)'),
    
    invoiceDate: z.string()
      .describe('Invoice date in ISO 8601 format YYYY-MM-DD (e.g., 2024-03-15). Defaults to today if not specified'),
    
    dueDate: z.string()
      .describe('Payment due date in ISO 8601 format. Must be after invoice date. Common terms: NET30 (30 days), NET60 (60 days)'),
    
    lineItems: z.array(z.object({
      description: z.string()
        .describe('Line item description (e.g., "Consulting Services - March 2024")'),
      quantity: z.number()
        .describe('Quantity as decimal number (e.g., 2.5 for 2.5 hours)'),
      unitPrice: z.number()
        .describe('Price per unit in USD (e.g., 150.00 for $150)'),
      taxRate: z.number().optional()
        .describe('Tax rate as decimal (e.g., 0.08 for 8% tax). Defaults to account settings if not specified')
    })).describe('Array of invoice line items. At least one item required'),
    
    paymentTerms: z.enum(['NET30', 'NET60', 'DUE_ON_RECEIPT', 'CUSTOM']).optional()
      .describe('Payment terms. NET30 = due in 30 days, NET60 = due in 60 days, DUE_ON_RECEIPT = immediate payment'),
    
    notes: z.string().optional()
      .describe('Additional notes or instructions (max 500 characters). Appears at bottom of invoice'),
    
    currency: z.string().default('USD')
      .describe('Three-letter currency code (ISO 4217). Examples: USD, EUR, GBP, JPY')
  })
});
```

#### Dynamic Examples in Descriptions

```typescript
function generateExamples(fieldType: string): string {
  const examples = {
    orderId: `Order ID format: ORD-20240315-0001 (ORD-YYYYMMDD-XXXX)`,
    email: `Email format: customer@example.com (must be valid email)`,
    phone: `Phone formats: +1-555-123-4567, (555) 123-4567, 555.123.4567`,
    date: `Date format: ${new Date().toISOString().split('T')[0]} (today), 2024-12-31 (specific date)`,
    percentage: `Percentage as decimal: 0.15 for 15%, 0.5 for 50%, 1.0 for 100%`,
    status: `Status values: active, pending, suspended, cancelled, completed`
  };
  return examples[fieldType] || 'No example available';
}
```

#### Validation Rules in Descriptions

```typescript
parameters: z.object({
  password: z.string()
    .min(8)
    .describe(`
      Password requirements:
      - Minimum 8 characters
      - Must contain: uppercase letter, lowercase letter, number
      - Special characters allowed: !@#$%^&*
      - Cannot contain spaces or user's name
      - Examples: MyPass123!, Secure#2024, P@ssw0rd!
    `),
  
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).describe(`
    Date range for filtering results:
    - Format: YYYY-MM-DD for both dates
    - Start date must be before end date
    - Maximum range: 365 days
    - Examples:
      - Last 30 days: start="2024-02-15", end="2024-03-15"
      - Specific month: start="2024-03-01", end="2024-03-31"
      - Year to date: start="2024-01-01", end="2024-03-15"
  `)
});
```

### Description Components Checklist

For each parameter, include:

- [ ] **Data type** (string, number, boolean, object, array)
- [ ] **Format specification** (ISO 8601, UUID, E.164)
- [ ] **Valid values or ranges** (enums, min/max)
- [ ] **Default values** if applicable
- [ ] **Required vs optional** status
- [ ] **Multiple examples** showing variations
- [ ] **Units** (currency, measurements, time zones)
- [ ] **Constraints** (max length, validation rules)
- [ ] **Related parameters** dependencies

### Common Pitfalls
1. **Assuming Claude knows your format** requirements
2. **Not providing examples** for complex data structures
3. **Forgetting to document** optional vs required parameters
4. **Not specifying units** (currency, measurements, time zones)
5. **Missing validation rules** in descriptions

---

## Best Practice #3: Break Complex APIs into Focused, Single-Purpose Tools

### Why This Matters
Large, multi-purpose tools are harder for Claude to use correctly. Breaking them down improves accuracy, reduces errors, and makes the system more maintainable. Each tool should do one thing well.

### Implementation Details

#### Decomposition Strategy

```typescript
// ❌ BAD: Monolithic tool trying to do everything
server.tool({
  name: 'manage_user',
  parameters: z.object({
    action: z.enum(['create', 'update', 'delete', 'get', 'list', 'search']),
    userId: z.string().optional(),
    userData: z.object({...}).optional(),
    searchQuery: z.string().optional(),
    filters: z.object({...}).optional(),
    // ... many more conditional parameters
  })
});

// ✅ GOOD: Separate focused tools
server.tool({
  name: 'create_user',
  description: 'Create a new user account',
  parameters: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['admin', 'user', 'guest']).default('user')
  })
});

server.tool({
  name: 'find_user_by_email',
  description: 'Find a specific user by their email address',
  parameters: z.object({
    email: z.string().email()
  })
});

server.tool({
  name: 'update_user_profile',
  description: 'Update user profile information',
  parameters: z.object({
    userId: z.string(),
    updates: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phoneNumber: z.string().optional()
    })
  })
});
```

#### Tool Granularity Guidelines

```typescript
// Level 1: Separate by entity
'user_*'     // All user operations
'order_*'    // All order operations
'product_*'  // All product operations

// Level 2: Separate by operation type
'user_create'
'user_search'
'user_update_profile'
'user_update_password'
'user_update_preferences'

// Level 3: Separate by use case (when needed)
'user_admin_create'        // Admin creating users
'user_self_register'       // User self-registration
'user_bulk_import'         // Bulk user import
```

#### Composition Pattern for Complex Operations

```typescript
// Instead of one complex tool, compose multiple simple ones
class OrderWorkflow {
  async processOrder(orderData: any) {
    // Step 1: Validate inventory
    const availability = await this.checkInventory(orderData.items);
    
    // Step 2: Calculate pricing
    const pricing = await this.calculatePricing(orderData);
    
    // Step 3: Create order
    const order = await this.createOrder({
      ...orderData,
      pricing
    });
    
    // Step 4: Process payment
    const payment = await this.processPayment(order.id, pricing.total);
    
    return order;
  }
}

// Expose each step as a separate tool
server.tool({ name: 'check_inventory', ... });
server.tool({ name: 'calculate_order_pricing', ... });
server.tool({ name: 'create_order', ... });
server.tool({ name: 'process_payment', ... });
```

### Tool Decomposition Decision Matrix

| Criteria | Keep Combined | Split into Separate Tools |
|----------|--------------|--------------------------|
| Parameters | <5 required | >5 required or many conditional |
| Logic complexity | Single operation | Multiple operations or branches |
| Error handling | Uniform errors | Different error types per operation |
| Performance | All fast operations | Mix of fast and slow operations |
| User mental model | Single concept | Multiple distinct concepts |

### Common Pitfalls
1. **Creating "Swiss Army knife" tools** that do too much
2. **Not considering the user journey** when splitting tools
3. **Over-decomposition** leading to too many micro-tools
4. **Forgetting to handle tool dependencies**
5. **Inconsistent granularity** across the API

---

## Best Practice #4: Include Context Prompts to Guide the AI

### Why This Matters
Context prompts provide Claude with domain knowledge, business rules, and operational guidelines that aren't obvious from tool descriptions alone. They reduce errors and improve response quality.

### Implementation Details

#### System-Level Context Prompts

```typescript
server.prompt({
  name: 'system_context',
  description: 'Core system information and business rules',
  arguments: [],
  handler: async () => {
    return {
      role: 'system',
      content: `
        # System Context and Business Rules
        
        ## Environment
        - System: E-commerce Platform v3.2
        - Region: North America (USD currency, EST/PST time zones)
        - API Rate Limits: 100 requests/minute per tool
        
        ## Business Rules
        
        ### Order Processing
        - Orders over $500 require manager approval
        - Same-day delivery only available for orders before 2 PM local time
        - Refunds can only be processed within 30 days of purchase
        - Digital products are non-refundable after download
        
        ### Inventory Management
        - Low stock threshold: 10 units
        - Reserved inventory expires after 15 minutes
        - Backorders allowed only for items restocking within 14 days
        
        ### Customer Accounts
        - Email addresses must be verified before first purchase
        - Guest checkout available for orders under $100
        - VIP customers (spending >$1000/year) get priority support
        
        ## Data Formats and Standards
        
        ### Identifiers
        - Order IDs: ORD-YYYYMMDD-XXXXX
        - Customer IDs: CUST-XXXXXXXX (8 alphanumeric)
        - Product SKUs: PROD-CAT-XXXXX
        
        ### Dates and Times
        - All dates in ISO 8601 format
        - Business hours: Mon-Fri 9 AM - 6 PM EST
        
        ## Common Workflows
        
        1. **New Order**: Validate → Calculate → Create → Process → Confirm
        2. **Returns**: Verify → Create RMA → Refund → Update inventory
        3. **Customer Service**: Identify → Review → Resolve → Log
      `
    };
  }
});
```

#### Dynamic Context Based on User State

```typescript
server.prompt({
  name: 'user_context',
  description: 'Context specific to the current user session',
  arguments: [
    { name: 'userId', type: 'string', required: false }
  ],
  handler: async ({ userId }) => {
    if (!userId) {
      return {
        role: 'system',
        content: 'User is not authenticated. Only public operations are available.'
      };
    }
    
    const user = await getUserProfile(userId);
    const recentActivity = await getUserRecentActivity(userId);
    
    return {
      role: 'system',
      content: `
        # Current User Context
        
        ## User Profile
        - Name: ${user.name}
        - Account Type: ${user.accountType}
        - Member Since: ${user.createdAt}
        - VIP Status: ${user.isVIP}
        
        ## Recent Activity
        - Last Order: ${recentActivity.lastOrder?.date}
        - Cart Items: ${recentActivity.cartItems}
        - Open Support Tickets: ${recentActivity.openTickets}
        
        ## Special Considerations
        ${user.isVIP ? '- VIP Customer: Priority service required' : ''}
        ${user.hasOpenReturn ? '- Has open return: Be helpful' : ''}
      `
    };
  }
});
```

### Context Types and When to Use Them

| Context Type | Purpose | Update Frequency |
|--------------|---------|------------------|
| System Context | Business rules, formats | On deployment |
| User Context | User-specific information | Per session |
| Domain Context | Industry knowledge | Rarely |
| Temporal Context | Time-sensitive info | Hourly/Daily |
| Error Context | Common issues and solutions | As needed |

### Common Pitfalls
1. **Providing too much context** (information overload)
2. **Not updating context** when business rules change
3. **Mixing static and dynamic context** incorrectly
4. **Forgetting timezone and regional** considerations
5. **Not including error handling guidance**

---

## Best Practice #5: Transform API Responses into AI-Friendly Formats

### Why This Matters
Raw API responses often contain technical data structures, codes, and formats that aren't natural for Claude to interpret or explain to users. Transformation makes responses more useful and accurate.

### Implementation Details

#### Response Transformation Pipeline

```typescript
class ResponseTransformer {
  static transform(endpoint: string, rawResponse: any): any {
    // Remove technical fields
    const cleaned = this.removeInternalFields(rawResponse);
    
    // Translate codes to human-readable values
    const translated = this.translateCodes(cleaned);
    
    // Format data for readability
    const formatted = this.formatData(translated);
    
    // Add interpretation and context
    const enriched = this.enrichResponse(formatted);
    
    // Structure for AI consumption
    return this.structureForAI(enriched);
  }
  
  private static removeInternalFields(data: any): any {
    const internalFields = [
      '__version', '_id', 'created_by_system',
      'internal_notes', 'debug_info', 'correlation_id'
    ];
    
    // Remove internal fields recursively
    if (typeof data === 'object' && data !== null) {
      const cleaned = { ...data };
      internalFields.forEach(field => delete cleaned[field]);
      return cleaned;
    }
    
    return data;
  }
  
  private static translateCodes(data: any): any {
    const codeTranslations = {
      status_codes: {
        'ORD_01': 'Pending Payment',
        'ORD_02': 'Payment Confirmed',
        'ORD_03': 'Preparing for Shipment',
        'ORD_04': 'Shipped',
        'ORD_05': 'Delivered'
      },
      country_codes: {
        'US': 'United States',
        'CA': 'Canada',
        'GB': 'United Kingdom'
      }
    };
    
    // Apply translations
    if (data.status_code) {
      data.status = codeTranslations.status_codes[data.status_code] 
        || data.status_code;
      delete data.status_code;
    }
    
    return data;
  }
  
  private static formatData(data: any): any {
    // Format timestamps
    if (data.created_timestamp) {
      data.created_date = new Date(data.created_timestamp * 1000)
        .toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      delete data.created_timestamp;
    }
    
    // Format currency values
    if (data.price_cents) {
      data.price = `$${(data.price_cents / 100).toFixed(2)}`;
      delete data.price_cents;
    }
    
    // Format percentages
    if (data.discount_rate) {
      data.discount = `${(data.discount_rate * 100).toFixed(0)}%`;
      delete data.discount_rate;
    }
    
    return data;
  }
  
  private static enrichResponse(data: any): any {
    // Add interpretations
    if (data.inventory_count !== undefined) {
      if (data.inventory_count === 0) {
        data.availability = 'Out of Stock';
      } else if (data.inventory_count < 5) {
        data.availability = 'Low Stock';
      } else {
        data.availability = 'In Stock';
      }
    }
    
    // Add summary for arrays
    if (Array.isArray(data)) {
      return {
        count: data.length,
        results: data,
        summary: `Found ${data.length} results`
      };
    }
    
    return data;
  }
}
```

#### Transformation Rules Matrix

| Raw Format | Transformed Format | Example |
|------------|-------------------|---------|
| Unix timestamp | Human-readable date | `1710432000` → `"March 14, 2024"` |
| Cents | Dollar amount | `1500` → `"$15.00"` |
| Status codes | Descriptive text | `"ORD_01"` → `"Pending Payment"` |
| Boolean flags | Status text | `true` → `"Enabled"` |
| Null values | Meaningful default | `null` → `"Not specified"` |
| Empty arrays | Descriptive message | `[]` → `"No results found"` |
| Technical IDs | Hidden or formatted | `"usr_123e4567"` → `"User #4567"` |

### Common Pitfalls
1. **Losing important data** during transformation
2. **Over-formatting** making data less precise
3. **Not handling null/undefined** values properly
4. **Forgetting to transform error** responses
5. **Breaking data relationships** during transformation

---

## Best Practice #6: Handle Errors Gracefully with Actionable Guidance

### Why This Matters
When errors occur, Claude needs to understand what went wrong and how to help the user recover. Good error handling turns frustrating failures into productive interactions.

### Implementation Details

#### Comprehensive Error Handling System

```typescript
class ErrorHandler {
  static async handleAPIError(error: any, context: any): Promise<ErrorResponse> {
    // Categorize the error
    const errorCategory = this.categorizeError(error);
    
    // Get user-friendly message
    const userMessage = this.getUserMessage(errorCategory, error);
    
    // Generate recovery actions
    const recoveryActions = this.getRecoveryActions(errorCategory, context);
    
    // Log for debugging
    await this.logError(error, context);
    
    // Return structured error response
    return {
      success: false,
      error: {
        category: errorCategory,
        user_message: userMessage,
        recovery_actions: recoveryActions,
        can_retry: this.isRetryable(errorCategory),
        estimated_resolution_time: this.getResolutionTime(errorCategory)
      }
    };
  }
  
  private static categorizeError(error: any): string {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 400) return 'VALIDATION_ERROR';
      if (status === 401) return 'AUTHENTICATION_ERROR';
      if (status === 403) return 'AUTHORIZATION_ERROR';
      if (status === 404) return 'NOT_FOUND';
      if (status === 429) return 'RATE_LIMIT';
      if (status >= 500) return 'SERVER_ERROR';
    }
    
    if (error.code === 'ECONNREFUSED') return 'CONNECTION_ERROR';
    if (error.code === 'ETIMEDOUT') return 'TIMEOUT_ERROR';
    
    return 'UNKNOWN_ERROR';
  }
  
  private static getRecoveryActions(category: string, context: any): RecoveryAction[] {
    const actions: { [key: string]: RecoveryAction[] } = {
      VALIDATION_ERROR: [
        {
          action: 'review_input',
          description: 'Review and correct the input data',
          tool: 'validate_input',
          parameters: context.originalParams
        }
      ],
      
      AUTHENTICATION_ERROR: [
        {
          action: 'refresh_token',
          description: 'Refresh authentication token',
          tool: 'refresh_auth_token'
        }
      ],
      
      NOT_FOUND: [
        {
          action: 'search',
          description: 'Search for the item',
          tool: 'search_items',
          parameters: { query: context.searchTerm }
        }
      ],
      
      RATE_LIMIT: [
        {
          action: 'wait',
          description: 'Wait before retrying',
          wait_seconds: 60
        }
      ]
    };
    
    return actions[category] || [];
  }
}
```

#### Retry Logic with Exponential Backoff

```typescript
class RetryManager {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryableErrors = ['SERVER_ERROR', 'TIMEOUT_ERROR', 'CONNECTION_ERROR']
    } = options;
    
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        const errorCategory = ErrorHandler.categorizeError(error);
        
        if (!retryableErrors.includes(errorCategory)) {
          throw error; // Non-retryable error
        }
        
        if (attempt === maxAttempts) {
          throw new Error(`Failed after ${maxAttempts} attempts`);
        }
        
        // Calculate delay with jitter
        const baseDelay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        const jitter = Math.random() * 0.1 * baseDelay;
        const delay = baseDelay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}
```

### Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  error: {
    category: string;
    user_message: string;
    recovery_actions: RecoveryAction[];
    can_retry: boolean;
    estimated_resolution_time?: string;
    technical_details?: any; // Only in debug mode
  };
}

interface RecoveryAction {
  action: string;
  description: string;
  tool?: string;
  parameters?: any;
  wait_seconds?: number;
  external?: boolean;
}
```

### Common Pitfalls
1. **Exposing technical error details** to end users
2. **Not providing actionable recovery** steps
3. **Forgetting to implement retry logic** for transient errors
4. **Not logging errors** for debugging
5. **Treating all errors the same way**

---

## Best Practice #7: Implement Parameter Validation Before API Calls

### Why This Matters
Validating parameters before making API calls prevents unnecessary network requests, reduces costs, provides faster feedback, and ensures data integrity. It's your first line of defense against errors.

### Implementation Details

#### Multi-Layer Validation Strategy

```typescript
class ParameterValidator {
  static async validate(
    toolName: string,
    params: any,
    schema: z.ZodSchema
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // Layer 1: Schema validation (Zod)
    const schemaResult = await this.validateSchema(params, schema);
    if (!schemaResult.success) {
      errors.push(...schemaResult.errors);
    }
    
    // Layer 2: Business rule validation
    const businessResult = await this.validateBusinessRules(toolName, params);
    if (!businessResult.success) {
      errors.push(...businessResult.errors);
    }
    
    // Layer 3: Cross-field validation
    const crossFieldResult = this.validateCrossFields(toolName, params);
    if (!crossFieldResult.success) {
      errors.push(...crossFieldResult.errors);
    }
    
    // Layer 4: External validation (database lookups)
    const externalResult = await this.validateExternal(toolName, params);
    if (!externalResult.success) {
      errors.push(...externalResult.errors);
    }
    
    return {
      success: errors.length === 0,
      errors,
      warnings: this.getWarnings(toolName, params),
      sanitizedParams: this.sanitizeParams(params)
    };
  }
  
  private static async validateBusinessRules(
    toolName: string,
    params: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    switch (toolName) {
      case 'create_order':
        // Minimum order amount
        if (params.totalAmount < 10) {
          errors.push({
            field: 'totalAmount',
            message: 'Minimum order amount is $10',
            code: 'MIN_ORDER_AMOUNT',
            severity: 'error'
          });
        }
        
        // Maximum items per order
        if (params.items?.length > 100) {
          errors.push({
            field: 'items',
            message: 'Maximum 100 items per order',
            code: 'MAX_ITEMS_EXCEEDED',
            severity: 'error'
          });
        }
        break;
    }
    
    return { success: errors.length === 0, errors };
  }
}
```

#### Custom Validators for Common Patterns

```typescript
class CustomValidators {
  // Email validation with DNS check
  static async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Optional: DNS validation
    const domain = email.split('@')[1];
    try {
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords.length > 0;
    } catch {
      return false;
    }
  }
  
  // Credit card validation (Luhn algorithm)
  static validateCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
  
  // Date range validation with business days
  static validateBusinessDateRange(
    startDate: Date,
    endDate: Date,
    maxBusinessDays: number
  ): boolean {
    let businessDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays <= maxBusinessDays;
  }
}
```

### Validation Layers

| Layer | Purpose | Examples | Performance Impact |
|-------|---------|----------|-------------------|
| Schema | Type and format checking | String length, number ranges | Fast |
| Business Rules | Domain-specific rules | Minimum order amount | Fast |
| Cross-field | Field dependencies | Date ranges, related fields | Fast |
| External | Database/API validation | User exists, product available | Slow |

### Common Pitfalls
1. **Validating only on the frontend**
2. **Not validating data types** and formats
3. **Missing edge cases** in validation logic
4. **Not sanitizing input** before validation
5. **Performing expensive validations** too early

---

## Best Practice #8: Cache Results When Appropriate for Refinement

### Why This Matters
Caching reduces API calls, improves response times, enables iterative refinement of results, and provides better user experience when exploring data. It's essential for complex queries and data exploration.

### Implementation Details

#### Intelligent Caching System

```typescript
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private searchCache: Map<string, SearchCacheEntry> = new Map();
  
  // Main caching interface
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = 300000, // 5 minutes default
      force = false,
      cacheCondition = () => true,
      keyGenerator = this.defaultKeyGenerator
    } = options;
    
    const cacheKey = keyGenerator(key);
    
    // Check if force refresh
    if (force) {
      return await this.fetchAndCache(cacheKey, fetcher, ttl, cacheCondition);
    }
    
    // Check existing cache
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      cached.lastAccessed = Date.now();
      return cached.data as T;
    }
    
    // Fetch and cache new data
    return await this.fetchAndCache(cacheKey, fetcher, ttl, cacheCondition);
  }
  
  // Search-specific caching with refinement support
  async cacheSearchResults(
    query: string,
    results: any[],
    metadata: SearchMetadata
  ): Promise<string> {
    const searchId = this.generateSearchId();
    
    this.searchCache.set(searchId, {
      query,
      results,
      metadata,
      refinements: [],
      timestamp: Date.now(),
      ttl: 1800000 // 30 minutes for search results
    });
    
    return searchId;
  }
  
  async refineSearch(
    searchId: string,
    refinement: SearchRefinement
  ): Promise<any[]> {
    const cached = this.searchCache.get(searchId);
    
    if (!cached || this.isExpired(cached)) {
      throw new Error('Original search results expired');
    }
    
    let refined = [...cached.results];
    
    // Apply filters
    if (refinement.filters) {
      refined = this.applyFilters(refined, refinement.filters);
    }
    
    // Apply sorting
    if (refinement.sort) {
      refined = this.applySort(refined, refinement.sort);
    }
    
    // Store refinement history
    cached.refinements.push({
      ...refinement,
      timestamp: Date.now()
    });
    
    return refined;
  }
  
  // LRU eviction
  private evictIfNeeded(): void {
    const maxSize = 1000;
    const maxMemory = 50 * 1024 * 1024; // 50MB
    
    if (this.cache.size <= maxSize && this.getMemoryUsage() <= maxMemory) {
      return;
    }
    
    // Sort by last accessed time
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove least recently used
    const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}
```

#### Cache Configuration by Data Type

```typescript
const cacheConfig = {
  // Frequently changing data - short TTL
  realTimeData: {
    ttl: 30 * 1000,        // 30 seconds
    strategy: 'aggressive-refresh',
    condition: (data) => data !== null
  },
  
  // Moderately stable data
  userProfiles: {
    ttl: 5 * 60 * 1000,    // 5 minutes
    strategy: 'lru',
    maxEntries: 100
  },
  
  // Stable reference data - long TTL
  staticLookups: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    strategy: 'warm-on-start',
    refreshInterval: 6 * 60 * 60 * 1000 // 6 hours
  },
  
  // Search results - session-based
  searchResults: {
    ttl: 30 * 60 * 1000,   // 30 minutes
    strategy: 'session',
    enableRefinement: true
  }
};
```

### Cache Strategy Decision Tree

```
Start
  │
  ├─ Is data user-specific?
  │   ├─ Yes → Short TTL (5 min), key by user ID
  │   └─ No → Continue
  │
  ├─ How often does data change?
  │   ├─ Real-time → Very short TTL (30s) or no cache
  │   ├─ Hourly → Medium TTL (30 min)
  │   ├─ Daily → Long TTL (hours)
  │   └─ Rarely → Very long TTL (days) + warm cache
  │
  ├─ Is it expensive to fetch?
  │   ├─ Yes → Aggressive caching + pre-warming
  │   └─ No → Conservative caching
  │
  └─ Is refinement needed?
      ├─ Yes → Session cache with refinement support
      └─ No → Standard cache
```

### Common Pitfalls
1. **Caching sensitive or personal data** without proper security
2. **Not setting appropriate TTL** values
3. **Cache key collisions** from poor key generation
4. **Memory leaks** from unbounded cache growth
5. **Not invalidating cache** when data changes

---

## Best Practice #9: Document Field Mappings as MCP Resources

### Why This Matters
Field mappings serve as a reference guide that helps Claude understand the relationship between user-friendly terms and API field names. This reduces errors and improves the accuracy of API calls.

### Implementation Details

#### Comprehensive Field Mapping Resources

```typescript
class FieldMappingResources {
  static async registerMappings(server: MCPServer): Promise<void> {
    // Main field mapping resource
    server.resource({
      uri: 'mappings://fields/all',
      name: 'Complete Field Mappings Reference',
      mimeType: 'application/json',
      handler: async () => {
        return {
          text: JSON.stringify(this.getAllMappings(), null, 2)
        };
      }
    });
    
    // Entity-specific mappings
    server.resource({
      uri: 'mappings://fields/customer',
      name: 'Customer Field Mappings',
      mimeType: 'application/json',
      handler: async () => {
        return {
          text: JSON.stringify(this.getCustomerMappings(), null, 2)
        };
      }
    });
    
    // Data type conversion guide
    server.resource({
      uri: 'mappings://types/conversions',
      name: 'Data Type Conversion Guide',
      mimeType: 'text/markdown',
      handler: async () => {
        return {
          text: this.getTypeConversionGuide()
        };
      }
    });
  }
  
  private static getAllMappings(): FieldMappingDocument {
    return {
      version: '2.0.0',
      lastUpdated: '2024-03-15',
      mappings: {
        customer: {
          displayName: 'Customer',
          apiEndpoint: '/api/v2/customers',
          fields: {
            'customer id': {
              apiField: 'customer_uuid',
              type: 'string',
              format: 'UUID v4',
              example: '123e4567-e89b-12d3-a456-426614174000',
              required: true
            },
            'email': {
              apiField: 'email_address',
              type: 'string',
              format: 'email',
              maxLength: 255
            },
            'credit limit': {
              apiField: 'credit_limit_cents',
              type: 'integer',
              format: 'cents',
              displayFormat: 'dollars',
              conversionFactor: 100
            }
          }
        }
      }
    };
  }
}
```

#### Data Type Conversion Guide

```markdown
# Data Type Conversion Guide

## Monetary Values
- **API Format**: All monetary values stored as integers in cents
- **Display Format**: Convert to dollars by dividing by 100
- **Example**: $10.50 → 1050 cents

## Dates and Times
- **API Format**: ISO 8601 with timezone (YYYY-MM-DDTHH:mm:ssZ)
- **Display Format**: Localized format based on user preferences
- **Timezone Handling**: Store in UTC, display in user's timezone

## Phone Numbers
- **API Format**: E.164 format (+1234567890)
- **Display Format**: National format ((123) 456-7890)
- **Validation**: Use libphonenumber

## Percentages
- **API Format**: Decimal (0.15 for 15%)
- **Display Format**: Percentage (15%)
- **Range**: 0.0 to 1.0 (0% to 100%)
```

### Field Mapping Structure

```typescript
interface FieldMappingDocument {
  version: string;
  lastUpdated: string;
  mappings: {
    [entity: string]: {
      displayName: string;
      apiEndpoint: string;
      fields: {
        [friendlyName: string]: {
          apiField: string;
          type: string;
          format?: string;
          example?: any;
          required?: boolean;
          validation?: string;
          conversionFactor?: number;
        };
      };
    };
  };
  globalMappings: {
    [commonTerm: string]: string;
  };
}
```

### Common Pitfalls
1. **Not keeping mappings synchronized** with API changes
2. **Missing edge cases** in field transformations
3. **Overly complex** nested structures
4. **Not documenting deprecated** fields
5. **Forgetting to version** mapping documents

---

## Best Practice #10: Test with Real User Queries to Ensure Proper Mapping

### Why This Matters
Real-world testing reveals gaps in your mapping logic, uncovers edge cases, validates assumptions about user behavior, and ensures the system works as intended for actual use cases.

### Implementation Details

#### Comprehensive Testing Framework

```typescript
class QueryTestingFramework {
  private testResults: TestResult[] = [];
  
  async runTestSuite(testSuite: TestSuite): Promise<TestReport> {
    console.log(`Running test suite: ${testSuite.name}`);
    const startTime = Date.now();
    
    for (const testCase of testSuite.testCases) {
      await this.runTestCase(testCase);
    }
    
    const report = this.generateReport(testSuite, Date.now() - startTime);
    await this.saveReport(report);
    
    return report;
  }
  
  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const result: TestResult = {
      id: testCase.id,
      name: testCase.name,
      query: testCase.query,
      status: 'pending',
      actualTool: null,
      actualParams: null,
      validationErrors: []
    };
    
    try {
      // Test query to tool mapping
      const mappingResult = await this.testQueryMapping(testCase);
      result.actualTool = mappingResult.tool;
      result.actualParams = mappingResult.params;
      
      // Validate mapped parameters
      const validationResult = this.validateMapping(testCase, mappingResult);
      result.validationErrors = validationResult.errors;
      
      // Determine test status
      result.status = this.determineTestStatus(result);
      
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
    }
    
    this.testResults.push(result);
    return result;
  }
}
```

#### Real-World Test Cases

```typescript
const realWorldTestSuite: TestSuite = {
  name: 'Real World User Queries',
  testCases: [
    // Simple queries
    {
      id: 'simple_1',
      name: 'Basic product search',
      query: 'Find me wireless headphones under $200',
      expectedTool: 'search_products',
      expectedParams: {
        query: 'wireless headphones',
        maxPrice: 200
      }
    },
    
    // Complex queries
    {
      id: 'complex_1',
      name: 'Multi-criteria order search',
      query: 'Show my orders from last month that are still pending',
      expectedTool: 'list_orders',
      expectedParams: {
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        status: ['PENDING', 'PROCESSING']
      }
    },
    
    // Ambiguous queries
    {
      id: 'ambiguous_1',
      name: 'Vague status request',
      query: 'What\'s the status?',
      expectedTool: null,
      expectedResponse: {
        needsClarification: true
      }
    },
    
    // Natural language variations
    {
      id: 'variation_1',
      name: 'Colloquial product search',
      query: 'Got any good deals on laptops?',
      expectedTool: 'search_products',
      expectedParams: {
        query: 'laptops',
        sortBy: 'price_asc'
      }
    }
  ]
};
```

#### Query Interpreter for Testing

```typescript
class QueryInterpreter {
  async interpret(query: string): Promise<InterpretedQuery> {
    const intent = this.extractIntent(query);
    const entities = this.extractEntities(query);
    const parameters = this.extractParameters(query);
    
    return {
      original: query,
      normalized: this.normalize(query),
      intent,
      entities,
      parameters,
      confidence: this.calculateConfidence(intent, entities)
    };
  }
  
  private extractIntent(query: string): string {
    const intentPatterns = {
      search: /find|search|look for|show me|got any/i,
      create: /create|add|new|make/i,
      update: /update|change|modify|edit/i,
      delete: /delete|remove|cancel/i,
      list: /list|show|display|what are/i
    };
    
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(query)) {
        return intent;
      }
    }
    
    return 'unknown';
  }
}
```

### Test Categories and Coverage

| Category | Description | Test Count | Priority |
|----------|-------------|------------|----------|
| Simple Queries | Basic single-purpose requests | 20 | High |
| Complex Queries | Multi-criteria, multi-step | 15 | High |
| Ambiguous Queries | Requiring clarification | 10 | Medium |
| Natural Language | Colloquial, informal | 15 | High |
| Error Cases | Invalid inputs, edge cases | 10 | Medium |
| Regional Variations | Different spellings, formats | 5 | Low |
| Contextual | Follow-up queries | 10 | Medium |

### Common Pitfalls
1. **Testing only happy path** scenarios
2. **Not testing with non-English** queries
3. **Ignoring performance metrics**
4. **Not updating tests** when API changes
5. **Using theoretical instead of real** user queries

---

## Quick Reference Guide

### Implementation Checklist

#### Foundation
- [ ] Set up TypeScript project with proper types
- [ ] Configure authentication and API connection
- [ ] Implement error handling framework
- [ ] Set up logging and monitoring

#### Tool Development
- [ ] Use descriptive tool names (2-4 words)
- [ ] Provide rich parameter descriptions with examples
- [ ] Break complex operations into focused tools
- [ ] Implement parameter validation

#### Intelligence Layer
- [ ] Add system context prompts
- [ ] Implement response transformation
- [ ] Create field mapping resources
- [ ] Set up intelligent caching

#### Testing & Optimization
- [ ] Create comprehensive test suite
- [ ] Test with real user queries
- [ ] Optimize performance bottlenecks
- [ ] Document all tools and mappings

### Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Tool selection accuracy | 95% | - |
| Response time (cached) | 100ms | 500ms |
| Response time (uncached) | 500ms | 2000ms |
| Error recovery rate | 80% | - |
| Cache hit rate | 60% | - |

### Common Patterns

#### Tool Naming Pattern
```
[action]_[target]_[qualifier]
```

#### Error Response Pattern
```typescript
{
  success: false,
  error: string,
  userMessage: string,
  suggestions: string[],
  actions: RecoveryAction[]
}
```

#### Cache Key Pattern
```
[entity]:[id]:[version]:[user?]
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Over-Engineering
**Problem**: Creating overly complex abstractions  
**Solution**: Start simple, add complexity only when needed

### Pitfall 2: Ignoring Rate Limits
**Problem**: Hitting API rate limits during peak usage  
**Solution**: Implement rate limiting, caching, and request batching

### Pitfall 3: Poor Error Messages
**Problem**: Technical error messages confusing users  
**Solution**: Transform all errors into user-friendly guidance

### Pitfall 4: Inconsistent Naming
**Problem**: Similar tools with different naming patterns  
**Solution**: Establish and enforce naming conventions

### Pitfall 5: Missing Context
**Problem**: AI making incorrect assumptions  
**Solution**: Provide comprehensive context prompts

### Pitfall 6: No Cache Strategy
**Problem**: Unnecessary API calls slowing responses  
**Solution**: Implement intelligent caching with appropriate TTLs

### Pitfall 7: Weak Validation
**Problem**: Invalid parameters causing API errors  
**Solution**: Multi-layer validation before API calls

### Pitfall 8: Complex Tools
**Problem**: Single tool trying to do everything  
**Solution**: Break into focused, single-purpose tools

### Pitfall 9: Poor Documentation
**Problem**: Claude doesn't understand parameter requirements  
**Solution**: Rich descriptions with examples and validation rules

### Pitfall 10: No Real Testing
**Problem**: System fails with actual user queries  
**Solution**: Test with real-world queries from users

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] Authentication implementation
- [ ] Basic tool structure
- [ ] Error handling framework
- [ ] Logging setup

### Phase 2: Core Development (Week 2-3)
- [ ] Implement primary tools
- [ ] Add parameter validation
- [ ] Create response transformers
- [ ] Build context prompts
- [ ] Set up caching layer

### Phase 3: Intelligence (Week 4)
- [ ] Field mapping resources
- [ ] Advanced error handling
- [ ] Query interpretation
- [ ] Refinement support
- [ ] Performance optimization

### Phase 4: Testing & Deployment (Week 5)
- [ ] Comprehensive test suite
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation completion
- [ ] Production deployment

### Ongoing Maintenance
- [ ] Monitor error rates
- [ ] Update field mappings
- [ ] Optimize slow queries
- [ ] Expand test coverage
- [ ] Gather user feedback

---

## Conclusion

Building effective MCP servers requires careful attention to how natural language queries map to API operations. These 10 best practices provide a framework for creating robust, user-friendly, and maintainable MCP servers.

### Key Takeaways

1. **Design for humans first** - Tool names and parameters should match user mental models
2. **Fail gracefully** - Every error should guide users to resolution
3. **Document thoroughly** - Rich descriptions and examples prevent errors
4. **Cache intelligently** - Reduce latency and enable data exploration
5. **Test with reality** - Use actual user queries, not theoretical tests

### Next Steps

1. Start with a simple implementation following these practices
2. Test with real users early and often
3. Iterate based on usage patterns and feedback
4. Continuously optimize performance
5. Keep documentation synchronized with implementation

### Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)

---

## About This Guide

This guide represents best practices developed through extensive experience building production MCP servers. It will be updated as the MCP ecosystem evolves and new patterns emerge.

**Contributing**: If you have suggestions or improvements, please contribute to the community knowledge base.

**License**: This guide is provided under Creative Commons CC-BY-4.0 license.

---

**End of Document**