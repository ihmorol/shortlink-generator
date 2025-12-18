import { z } from 'zod';

export const LinkSchema = z.object({
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug is too long")
    .regex(/^[a-zA-Z0-9-_]+$/, "Slug can only contain letters, numbers, hyphens, and underscores"),
  originalUrl: z.string().url("Invalid URL format"),
  description: z.string().max(500, "Description is too long").optional(),
  clicks: z.number().int().nonnegative().optional()
});

export const UpdateLinkSchema = LinkSchema.extend({
  id: z.string()
});

export const SettingsSchema = z.object({
  baseUrl: z.string().url("Invalid URL format").refine(url => url.endsWith('/'), "Base URL must end with a slash")
});
