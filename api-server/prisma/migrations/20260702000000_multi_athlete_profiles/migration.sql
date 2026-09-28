-- Drop the unique constraint on userId to allow multiple athlete profiles per user
ALTER TABLE "AthleteProfile" DROP CONSTRAINT IF EXISTS "AthleteProfile_userId_key";

-- Add compound unique constraint: one profile per sport per user
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_sportId_key" UNIQUE ("userId", "sportId");

-- Add index on userId for faster lookups
CREATE INDEX IF NOT EXISTS "AthleteProfile_userId_idx" ON "AthleteProfile" ("userId");
