import z from "zod";

export type ValidationErrors = Record<string, string>;

export const formatZodErrors = (err: unknown): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (err instanceof z.ZodError) {
    for (const issue of err.issues) {
      const path = issue.path?.join(".") || "form";
      if (!errors[path]) errors[path] = issue.message;
    }
    return errors;
  }

  if (typeof err === "object" && err !== null && "issues" in err) {
    const anyErr = err as {
      issues?: Array<{ path?: (string | number)[]; message?: string }>;
    };
    for (const issue of anyErr.issues ?? []) {
      const path = issue?.path?.join(".") || "form";
      const message = issue?.message || "Invalid input";
      if (!errors[path]) errors[path] = message;
    }
    return errors;
  }
  
  errors.form = 'Validation failed'
  return errors
}
