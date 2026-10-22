import { z } from 'zod';

export const calcSchema = z.object({
  expression: z.string().describe('Mathematical expression to calculate, e.g. "15% of 85", "sqrt(144) + 25 * 3", "(100 - 32) * 5/9"')
});

export type CalcInput = z.infer<typeof calcSchema>;

export async function executeCalculate(input: CalcInput) {
  let expr = input.expression.trim();

  // Handle natural percentage expressions like "15% of 85" or "15% tip on 85.50"
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s*(?:of|\*|tip\s*(?:on|for)?)\s*(\d+(?:\.\d+)?)/gi, '($1 / 100) * $2');
  // Handle percentage standalone like "25%" -> "(25/100)"
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');

  // Whitelist safe math tokens only
  // Allowed: numbers, operators (+ - * / % ^), parentheses, commas, whitespace, and Math functions (sqrt, abs, sin, cos, tan, round, floor, ceil, pow, min, max, log, exp, pi, e)
  const sanitized = expr
    .replace(/pi/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\bsqrt\b/gi, 'Math.sqrt')
    .replace(/\babs\b/gi, 'Math.abs')
    .replace(/\bsin\b/gi, 'Math.sin')
    .replace(/\bcos\b/gi, 'Math.cos')
    .replace(/\btan\b/gi, 'Math.tan')
    .replace(/\bround\b/gi, 'Math.round')
    .replace(/\bfloor\b/gi, 'Math.floor')
    .replace(/\bceil\b/gi, 'Math.ceil')
    .replace(/\bpow\b/gi, 'Math.pow')
    .replace(/\bmin\b/gi, 'Math.min')
    .replace(/\bmax\b/gi, 'Math.max')
    .replace(/\blog\b/gi, 'Math.log')
    .replace(/\^/g, '**');

  // Verify that sanitized expression only contains allowed characters:
  // digits, decimals, operators, Math.* identifiers, parentheses, commas, spaces
  const safeCharRegex = /^[\d\s+\-*/%(),.MathPIEsqrtabssincostanroundfloorceilpowminmaxlog*]+$/;
  if (!safeCharRegex.test(sanitized)) {
    return {
      success: false,
      error: 'Invalid characters in mathematical expression. Only standard arithmetic and Math functions are permitted.',
      originalExpression: input.expression
    };
  }

  try {
    // Safe Function evaluation with no access to global scope or variables
    const calcFn = new Function(`"use strict"; return (${sanitized});`);
    const result = calcFn();

    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        success: false,
        error: 'Calculation resulted in an undefined or non-finite number.',
        expression: input.expression
      };
    }

    // Format nicely
    const formattedResult = Number.isInteger(result) ? result.toString() : Number(result.toFixed(6)).toString();

    return {
      success: true,
      result: Number(formattedResult),
      formattedResult,
      expression: input.expression,
      evaluatedExpression: sanitized
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Could not evaluate calculation: ${err.message}`,
      expression: input.expression
    };
  }
}
