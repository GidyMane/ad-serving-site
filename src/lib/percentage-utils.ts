/**
 * Utility functions for safe percentage calculations and display
 */

/**
 * Safely formats a percentage value, ensuring it never exceeds 100%
 * @param value - The percentage value (can be over 100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string capped at 100%
 */
export function safePercentage(value: number | undefined | null, decimals: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%'
  }
  
  const cappedValue = Math.min(100, Math.max(0, value))
  return `${cappedValue.toFixed(decimals)}%`
}

/**
 * Safely calculates a percentage from two numbers, capped at 100%
 * @param numerator - The numerator value
 * @param denominator - The denominator value  
 * @param decimals - Number of decimal places (default: 1)
 * @returns Calculated percentage capped at 100%
 */
export function safePercentageCalc(
  numerator: number | undefined | null, 
  denominator: number | undefined | null, 
  decimals: number = 1
): string {
  if (!numerator || !denominator || denominator === 0) {
    return '0%'
  }
  
  const percentage = (numerator / denominator) * 100
  return safePercentage(percentage, decimals)
}

/**
 * Returns the numeric value of a percentage, capped at 100%
 * @param value - The percentage value
 * @returns Numeric percentage value capped at 100%
 */
export function safePercentageValue(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) {
    return 0
  }
  
  return Math.min(100, Math.max(0, value))
}
