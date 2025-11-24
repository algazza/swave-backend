import z from "zod";

export const registerSchema = z.object({
  name: z.string("This field is required"),
  username: z
    .string("This field is required")
    .trim()
    .toLowerCase()
    .min(6, "character must be more than 6")
    .regex(
      /^[a-z0-9_]+$/i,
      "Usernames may only contain letters, numbers, and underscores"
    ),
  phone: z.string("This field is required").regex(/^\+62\d+$/, {
    message: "Number begin with +62",
  }),
  password: z
    .string("This field is required")
    .min(6, "character must be more than 6"),
});

export const loginSchema = z.object({
  username: z
    .string("This field is required")
    .trim()
    .toLowerCase()
    .min(6, "character must be more than 6")
    .regex(
      /^[a-z0-9_]+$/i,
      "Usernames may only contain letters, numbers, and underscores"
    ),
  password: z
    .string("This field is required")
    .min(6, "character must be more than 6"),
});
