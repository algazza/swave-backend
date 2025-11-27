import z from "zod";

export const AddressSchema = z.object({
  recipient: z.string(),
  label: z.enum(["rumah", "kantor", "kos", "sekolah", "apartemen"]),
  city: z.string(),
  subdistrict: z.string(),
  zip_code: z.string().regex(/^\d{5}$/, "Must 5 digit"),
  address: z.string(),
  main_address: z.boolean(),
});


