import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const rootDir = process.cwd()
const eslintConfigPath = path.join(rootDir, ".eslintrc.cjs")
const prettierConfigPath = path.join(rootDir, ".prettierrc.cjs")

function checkConfigExists(configPath, configName) {
  if (!fs.existsSync(configPath)) {
    console.warn(`Warning: ${configName} not found at ${configPath}.`)
    return false
  }
  return true
}

function runLintFix(dir) {
  try {
    execSync(`pnpm lint:fix`, {
      cwd: dir,
      stdio: "inherit",
    })
    console.log(`Lint fix completed successfully in ${dir}`)
  } catch (_error) {
    console.error(`Lint fix failed in ${dir}`)
  }
}

function runPrettierFix(dir) {
  try {
    execSync(`pnpm format`, {
      cwd: dir,
      stdio: "inherit",
    })
    console.log(`Prettier fix completed successfully in ${dir}`)
  } catch (_error) {
    console.error(`Prettier fix failed in ${dir}`)
  }
}

function fixLintIssues() {
  const packagesDir = path.join(rootDir, "packages")

  if (!fs.existsSync(packagesDir)) {
    console.error("Error: packages directory not found.")
    process.exit(1)
  }

  const packageNames = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  if (packageNames.length === 0) {
    console.warn("Warning: No packages found in the packages directory.")
    return
  }

  const eslintConfigExists = checkConfigExists(eslintConfigPath, ".eslintrc.cjs")
  const prettierConfigExists = checkConfigExists(prettierConfigPath, ".prettierrc.cjs")

  if (!eslintConfigExists && !prettierConfigExists) {
    console.warn("Warning: Neither .eslintrc.cjs nor .prettierrc.cjs found. Skipping lint and format fixes.")
    return
  }

  packageNames.forEach((packageName) => {
    const packageDir = path.join(packagesDir, packageName)
    console.log(`Processing package: ${packageName}`)

    if (eslintConfigExists) {
      runLintFix(packageDir)
    } else {
      console.log(`Skipping lint fix for ${packageName} due to missing .eslintrc.cjs`)
    }

    if (prettierConfigExists) {
      runPrettierFix(packageDir)
    } else {
      console.log(`Skipping prettier fix for ${packageName} due to missing .prettierrc.cjs`)
    }
  })

  console.log("Lint and Prettier fix process completed.")
}

fixLintIssues()
