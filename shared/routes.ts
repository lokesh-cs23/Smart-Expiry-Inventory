import { z } from "zod";
import { insertItemSchema, items } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  items: {
    list: {
      method: "GET" as const,
      path: "/api/items" as const,
      responses: {
        200: z.array(z.custom<typeof items.$inferSelect>()),
      }
    },
    stats: {
      method: "GET" as const,
      path: "/api/items/stats" as const,
      responses: {
        200: z.object({
          total: z.number(),
          expired: z.number(),
          expiringSoon: z.number(),
          safe: z.number(),
        })
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/items/:id" as const,
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/items" as const,
      input: insertItemSchema,
      responses: {
        201: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: "PUT" as const,
      path: "/api/items/:id" as const,
      input: insertItemSchema.partial(),
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/items/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    bulkDelete: {
      method: "POST" as const,
      path: "/api/items/bulk-delete" as const,
      input: z.object({ ids: z.array(z.number()) }),
      responses: {
        200: z.object({ success: z.boolean() })
      }
    },
    lookupBarcode: {
      method: "GET" as const,
      path: "/api/barcode/:barcode" as const,
      responses: {
        200: z.object({ name: z.string() }),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ItemInput = z.infer<typeof api.items.create.input>;
export type ItemUpdateInput = z.infer<typeof api.items.update.input>;
