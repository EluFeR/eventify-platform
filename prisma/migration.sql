-- Migration: Add OrganizerApplication model and ApplicationStatus enum

CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "OrganizerApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "websiteOrSocial" TEXT NOT NULL,
    "eventDescription" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizerApplication_userId_key" ON "OrganizerApplication"("userId");

ALTER TABLE "OrganizerApplication" ADD CONSTRAINT "OrganizerApplication_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
