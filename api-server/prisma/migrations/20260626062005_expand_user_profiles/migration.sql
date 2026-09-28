/*
  Warnings:

  - You are about to drop the column `event` on the `Ranking` table. All the data in the column will be lost.
  - You are about to drop the column `isCaptain` on the `TeamMember` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_athleteId_fkey";

-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "classificationId" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "zaloUrl" TEXT;

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specialty" TEXT,
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "zaloUrl" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "editHistory" JSONB DEFAULT '[]',
ADD COLUMN     "imageAttachments" JSONB DEFAULT '[]',
ADD COLUMN     "reactions" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "audioDescUrl" TEXT,
ADD COLUMN     "vttUrl" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "classificationId" TEXT,
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "subTournamentId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "accessibilityFeatures" JSONB,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Ranking" DROP COLUMN "event",
ADD COLUMN     "classificationId" TEXT,
ADD COLUMN     "eventId" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "isCaptain",
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" TEXT;

-- CreateTable
CREATE TABLE "AssistantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "athleteId" TEXT,
    "medicalCertUrl" TEXT,
    "medicalDesc" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supportArea" TEXT,
    "facebookUrl" TEXT,
    "zaloUrl" TEXT,
    "tiktokUrl" TEXT,

    CONSTRAINT "AssistantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "classificationId" TEXT,
    "format" TEXT NOT NULL DEFAULT 'SINGLE_ELIMINATION',
    "participantType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "gender" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubTournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportEvent" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportClassification" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "medicalDesc" TEXT,
    "disabilityCriteria" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "genderRules" TEXT,
    "requiresAssistant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteAchievement" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "eventId" TEXT,
    "classificationId" TEXT,
    "medal" TEXT,
    "result" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medal" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "athleteId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AthleteProfileToTournament" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AthleteProfileToTournament_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistantProfile_userId_key" ON "AssistantProfile"("userId");

-- CreateIndex
CREATE INDEX "_AthleteProfileToTournament_B_index" ON "_AthleteProfileToTournament"("B");

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "SportClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantProfile" ADD CONSTRAINT "AssistantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantProfile" ADD CONSTRAINT "AssistantProfile_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTournament" ADD CONSTRAINT "SubTournament_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTournament" ADD CONSTRAINT "SubTournament_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTournament" ADD CONSTRAINT "SubTournament_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "SportClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_subTournamentId_fkey" FOREIGN KEY ("subTournamentId") REFERENCES "SubTournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SportEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "SportClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SportEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "SportClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportEvent" ADD CONSTRAINT "SportEvent_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportClassification" ADD CONSTRAINT "SportClassification_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAchievement" ADD CONSTRAINT "AthleteAchievement_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAchievement" ADD CONSTRAINT "AthleteAchievement_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAchievement" ADD CONSTRAINT "AthleteAchievement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SportEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAchievement" ADD CONSTRAINT "AthleteAchievement_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "SportClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medal" ADD CONSTRAINT "Medal_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medal" ADD CONSTRAINT "Medal_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AthleteProfileToTournament" ADD CONSTRAINT "_AthleteProfileToTournament_A_fkey" FOREIGN KEY ("A") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AthleteProfileToTournament" ADD CONSTRAINT "_AthleteProfileToTournament_B_fkey" FOREIGN KEY ("B") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
