import { z } from "zod";

// Register validation schema
const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name cannot exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string()
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim(),
    city: z.string()
      .max(50, "City name cannot exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "City can only contain letters and spaces")
      .optional(),
    mobile: z.string()
      .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
      .optional()
      .nullable(),
    password: z.string()
      .min(6, "Password must be at least 6 characters long")
      .max(128, "Password cannot exceed 128 characters")
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must contain at least one letter and one number"),
    confirmPassword: z.string(),
    role: z.enum(["user", "admin"]).optional().default("user")
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })
});

// Send OTP validation schema
const sendOTPSchema = z.object({
  body: z.object({
    email: z.string()
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim()
  })
});

// Verify OTP validation schema
const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string()
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim(),
    otp: z.string()
      .min(4, "OTP must be at least 4 characters")
      .max(6, "OTP cannot exceed 6 characters")
      .regex(/^\d+$/, "OTP must contain only numbers")
  })
});

// Login validation schema
const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(1, "Password is required")
  })
});

// Validation middleware function
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          message: "Validation failed",
          errors
        });
      }
      return res.status(500).json({
        message: "Validation error",
        error: error.message
      });
    }
  };
};

export const validateRegister = validateRequest(registerSchema);
export const validateSendOTP = validateRequest(sendOTPSchema);
export const validateVerifyOTP = validateRequest(verifyOTPSchema);
export const validateLogin = validateRequest(loginSchema);
