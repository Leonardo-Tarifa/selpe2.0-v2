import { z } from 'zod';

export const standardErrorResponseSchema = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  code: z.string(),
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        code: z.string().optional(),
      })
    )
    .optional(),
  requestId: z.string(),
  timestamp: z.string(),
  path: z.string(),
});

export type StandardErrorResponse = z.infer<typeof standardErrorResponseSchema>;
