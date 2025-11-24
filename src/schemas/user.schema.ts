import z from "zod";

export const updateUserSchema = z.object({
  name: z.string("This field is required").optional(),
  username: z
    .string("This field is required")
    .trim()
    .toLowerCase()
    .min(6, "character must be more than 6")
    .regex(
      /^[a-z0-9_]+$/i,
      "Usernames may only contain letters, numbers, and underscores"
    )
    .optional(),
  phone: z
    .string("This field is required")
    .regex(/^\+62\d+$/, {
      message: "Number begin with +62",
    })
    .optional(),
  password: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string("This field is required")
      .min(6, "character must be more than 6")
      .optional()
  ),
});
