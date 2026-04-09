import type { SupabaseClient } from '@supabase/supabase-js'

type ValidationRuleRow = {
  rule_value: unknown
}

function coerceBooleanRuleValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }

    return fallback
  }

  if (value && typeof value === 'object' && 'value' in value) {
    const nestedValue = (value as { value: unknown }).value
    return coerceBooleanRuleValue(nestedValue, fallback)
  }

  return fallback
}

export async function getValidationRuleBoolean(
  supabase: SupabaseClient,
  ruleCode: string,
  fallback: boolean
): Promise<boolean> {
  const { data, error } = await supabase
    .from('validation_rules')
    .select('rule_value')
    .eq('rule_code', ruleCode)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to fetch validation rule (${ruleCode}): ${error.message}`
    )
  }

  if (!data) {
    return fallback
  }

  return coerceBooleanRuleValue(
    (data as ValidationRuleRow).rule_value,
    fallback
  )
}
