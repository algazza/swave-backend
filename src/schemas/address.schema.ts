import z from "zod";

export const addressSchema = z.object({
  recipient: z.string(),
  label: z.enum(["rumah", "kantor", "kos", "sekolah", "apartemen"]),
  city: z.string(),
  subdistrict: z.string(),
  zip_code: z.string().regex(/^\d{5}$/, "Must 5 digit"),
  address: z.string(),
  main_address: z.boolean(),
});

export const updateAddressSchema = z.object({
  recipient: z.string().optional(),
  label: z.enum(["rumah", "kantor", "kos", "sekolah", "apartemen"]).optional(),
  city: z.string().optional(),
  subdistrict: z.string().optional(),
  zip_code: z.string().regex(/^\d{5}$/, "Must 5 digit").optional(),
  address: z.string().optional(),
  main_address: z.boolean().optional(),
});
