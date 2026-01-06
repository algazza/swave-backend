import z from "zod";

export const addressSchema = z.object({
  recipient: z.string(),
  label: z.enum(["Home", "Office", "School", "Apartment"]),
  city: z.string(),
  subdistrict: z.string(),
  zip_code: z.string().regex(/^\d{5}$/, "Must 5 digit"),
  address: z.string(),
  main_address: z.boolean(),
  description: z.string().optional(),
});

export const updateAddressSchema = z.object({
  recipient: z.string().optional(),
  label: z
    .enum(["Home", "Office", "School", "Apartment"])
    .optional(),
  city: z.string().optional(),
  subdistrict: z.string().optional(),
  zip_code: z
    .string()
    .regex(/^\d{5}$/, "Must 5 digit")
    .optional(),
  address: z.string().optional(),
  main_address: z.boolean().optional(),
  description: z.string().optional(),
});
