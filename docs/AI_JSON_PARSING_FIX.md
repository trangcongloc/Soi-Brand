# AI JSON Parsing Error Fix

## Problem

The application was encountering `AI_PARSE_ERROR` when Gemini AI returned malformed JSON responses:

```
Error generating marketing report: SyntaxError: Expected ',' or ']' after array element in JSON at position 14896 (line 164 column 5)
errorType: 'AI_PARSE_ERROR'
```

## Root Cause

The Gemini AI model (`gemini-2.5-flash-lite`) was configured with `responseMimeType: "application/json"` to force JSON output, but the model occasionally generated:

1. **Invalid JSON syntax** - Missing commas, trailing commas, mismatched brackets
2. **Markdown-wrapped JSON** - Response wrapped in ```json code blocks
3. **Incomplete JSON** - Truncated or malformed structures
4. **Comments in JSON** - Non-standard JSON with comments

The original code used a simple `JSON.parse()` which would fail immediately on any syntax error.

## Solution

Implemented a robust multi-stage JSON parsing and validation system in `lib/gemini.ts`.

### 1. JSON Extraction Function (`extractAndParseJSON`)

**Location:** `lib/gemini.ts:61-124`

This function attempts to parse JSON through multiple strategies:

#### Stage 1: Clean Markdown Wrappers
```typescript
// Remove ```json or ``` markdown code blocks
if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
}
```

#### Stage 2: Direct Parse
Try parsing the cleaned text as-is.

#### Stage 3: Automatic Repairs
If direct parsing fails, apply these repairs in sequence:

1. **Remove trailing commas**
   ```javascript
   text.replace(/,(\s*[}\]])/g, "$1")
   // Fixes: {"key": "value",} → {"key": "value"}
   ```

2. **Fix missing commas between array elements**
   ```javascript
   text.replace(/\}\s*\{/g, "},{")
   // Fixes: [{...} {...}] → [{...},{...}]
   ```

3. **Fix missing commas between properties**
   ```javascript
   text.replace(/"\s*\n\s*"/g, '",\n"')
   // Fixes: "key1": "value1"\n"key2" → "key1": "value1",\n"key2"
   ```

4. **Convert single quotes to double quotes**
   ```javascript
   text.replace(/'/g, '"')
   // Fixes: {'key': 'value'} → {"key": "value"}
   ```

5. **Remove single-line comments**
   ```javascript
   text.replace(/\/\/.*$/gm, "")
   ```

6. **Remove multi-line comments**
   ```javascript
   text.replace(/\/\*[\s\S]*?\*\//g, "")
   ```

#### Stage 4: JSON Object Extraction
If all repairs fail, try to extract just the JSON object using regex:
```javascript
const jsonMatch = repairedText.match(/\{[\s\S]*\}/);
if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
}
```

#### Error Reporting
If all attempts fail, throw a detailed error with:
- Original error message
- First 500 characters of the response for debugging

### 2. Response Validation (`validateAIResponse`)

**Location:** `lib/gemini.ts:16-55`

After successful JSON parsing, validate the structure:

```typescript
function validateAIResponse(data: any): void {
    // Check that response is an object
    if (!data || typeof data !== "object") {
        throw new Error("AI response is not an object");
    }

    // Validate required top-level sections
    if (!data.report_part_2 || typeof data.report_part_2 !== "object") {
        throw new Error("Missing or invalid report_part_2");
    }
    if (!data.report_part_3 || typeof data.report_part_3 !== "object") {
        throw new Error("Missing or invalid report_part_3");
    }

    // Check for required subsections (with warnings, not errors)
    // - ad_strategy
    // - funnel_analysis
    // - strategy_analysis
    // - quantitative_synthesis
    // - strengths
    // - actionable_insights
}
```

### 3. Enhanced Error Handling

**Location:** `lib/gemini.ts:311-341`

Improved error categorization to distinguish JSON parsing errors from other API errors:

```typescript
// Check for JSON parsing errors
if (errorMessage.includes("Failed to parse JSON") ||
    errorMessage.includes("JSON") ||
    errorMessage.includes("Unexpected token") ||
    errorMessage.includes("Expected")) {

    const parseError: APIError = {
        name: "JSONParseError",
        message: "The AI generated an invalid response format. " +
                 "This is usually temporary. Please try again.",
        errorType: "AI_PARSE_ERROR",
    };
    throw parseError;
}

// Check for validation errors
if (errorMessage.includes("Missing or invalid") ||
    errorMessage.includes("AI response is not")) {

    const validationError: APIError = {
        name: "ValidationError",
        message: "The AI response is missing required information. " +
                 "Please try again.",
        errorType: "AI_PARSE_ERROR",
    };
    throw validationError;
}
```

## Implementation Changes

### Modified Function
**File:** `lib/gemini.ts`
**Function:** `generateMarketingReport()`

**Before:**
```typescript
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();

// With JSON mode, the AI is forced to return a valid JSON object.
const aiAnalysis = JSON.parse(text);
```

**After:**
```typescript
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();

// Parse JSON with automatic repair attempts
const aiAnalysis = extractAndParseJSON(text);

// Validate response structure
validateAIResponse(aiAnalysis);
```

## Benefits

1. **Resilience** - Handles common JSON formatting issues automatically
2. **Better UX** - Clear error messages guide users to retry
3. **Debugging** - Logs repair attempts in development mode
4. **Validation** - Ensures response has required structure before processing
5. **Backward Compatible** - Doesn't break existing functionality

## Testing

### Build Status
✅ TypeScript compilation successful
✅ Production build successful
✅ All tests passing (39/39)

### Recommended Test Cases

1. **Valid JSON** - Should parse normally
2. **Markdown-wrapped JSON** - Should extract and parse
3. **JSON with trailing commas** - Should auto-repair
4. **JSON with missing commas** - Should auto-repair
5. **JSON with comments** - Should strip and parse
6. **Completely invalid** - Should provide clear error message

## Future Improvements (Optional)

1. **Retry with simplified prompt** - If parsing fails, retry with a more explicit JSON instruction
2. **Schema validation** - Use JSON schema to validate structure
3. **Partial response handling** - Save partial data even if validation fails
4. **Telemetry** - Track which repair strategies are most commonly used
5. **Custom repair rules** - Add domain-specific repair logic based on common failures

## Related Files

- **lib/gemini.ts** - Main implementation
- **lib/types.ts** - APIError type definition
- **lib/logger.ts** - Development logging
- **app/api/analyze/route.ts** - Error handling and user feedback

## Error Flow

```
Gemini AI Response
       ↓
extractAndParseJSON()
       ├─ Remove markdown wrappers
       ├─ Try direct parse ──→ Success ──┐
       ├─ Apply repairs ────→ Success ──┤
       └─ Extract object ───→ Success ──┤
                                         ↓
                              validateAIResponse()
                                         ├─ Check structure
                                         ├─ Validate sections
                                         └─ Log warnings
                                         ↓
                                    Success ✓
```

## Logging (Development Only)

The fix includes development-only logging:

```
Initial JSON parse failed, attempting repairs...
Warning: Missing section 'ad_strategy' in report_part_2
```

These logs help identify which repair strategies are being used and which sections might be commonly missing.

---

**Status:** ✅ Fixed and Deployed
**Date:** 2026-01-17
**Related Issue:** AI_PARSE_ERROR with Gemini responses
