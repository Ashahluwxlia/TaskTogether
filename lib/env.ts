// Environment variable validation
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"]

// Optional environment variables with defaults
const optionalEnvVars: Record<string, string> = {
  NODE_ENV: "development",
  PORT: "3000",
}

// Validate environment variables
export function validateEnv(): void {
  const missingVars: string[] = []

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar)
    }
  }

  // Set defaults for optional variables
  for (const [envVar, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[envVar]) {
      process.env[envVar] = defaultValue
    }
  }

  // Throw error if any required variables are missing
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
  }
}

// Get environment variables with type safety
export function getEnv<T extends string>(key: string, defaultValue?: T): T {
  const value = process.env[key] as T | undefined

  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not defined`)
    }
    return defaultValue
  }

  return value
}

// Call validation on module import
validateEnv()
