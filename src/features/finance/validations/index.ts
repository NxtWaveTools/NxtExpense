import { z } from 'zod'

export const financeActionSchema = z.object({
  claimId: z.string().uuid('Invalid claim identifier.'),
  action: z.enum(['issued', 'finance_rejected']),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional(),
})

export const bulkFinanceActionSchema = z.object({
  claimIds: z.array(z.string().uuid('Invalid claim identifier.')).min(1),
  action: z.literal('issued'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional(),
})

export type FinanceActionInput = z.infer<typeof financeActionSchema>
export type BulkFinanceActionInput = z.infer<typeof bulkFinanceActionSchema>
