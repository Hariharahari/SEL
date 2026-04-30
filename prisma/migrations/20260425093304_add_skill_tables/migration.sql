-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SkillMaintainer" (
    "skillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT NOT NULL,

    CONSTRAINT "SkillMaintainer_pkey" PRIMARY KEY ("skillId","userId")
);

-- CreateTable
CREATE TABLE "SkillDownload" (
    "skillId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillDownload_pkey" PRIMARY KEY ("userId","skillId","version")
);

-- CreateTable
CREATE TABLE "SkillFeedback" (
    "skillId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillFeedback_pkey" PRIMARY KEY ("userId","skillId","version")
);

-- CreateIndex
CREATE INDEX "SkillMaintainer_skillId_idx" ON "SkillMaintainer"("skillId");

-- CreateIndex
CREATE INDEX "SkillMaintainer_userId_idx" ON "SkillMaintainer"("userId");

-- CreateIndex
CREATE INDEX "SkillDownload_skillId_downloadedAt_idx" ON "SkillDownload"("skillId", "downloadedAt");

-- CreateIndex
CREATE INDEX "SkillDownload_skillId_version_idx" ON "SkillDownload"("skillId", "version");

-- CreateIndex
CREATE INDEX "SkillDownload_userId_idx" ON "SkillDownload"("userId");

-- CreateIndex
CREATE INDEX "SkillFeedback_skillId_version_idx" ON "SkillFeedback"("skillId", "version");

-- CreateIndex
CREATE INDEX "SkillFeedback_rating_idx" ON "SkillFeedback"("rating");

-- AddForeignKey
ALTER TABLE "SkillMaintainer" ADD CONSTRAINT "SkillMaintainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillMaintainer" ADD CONSTRAINT "SkillMaintainer_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDownload" ADD CONSTRAINT "SkillDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillFeedback" ADD CONSTRAINT "SkillFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SkillFeedback"
ADD CONSTRAINT rating_range
CHECK (rating >= 1 AND rating <= 5);