import { z } from 'zod'

export const approvalActionSchema = z.object({
  claimId: z.string().uuid('Invalid claim identifier.'),
  action: z.enum(['approved', 'rejected']),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional(),
})

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>
