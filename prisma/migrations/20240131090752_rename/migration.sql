/*
  Warnings:

  - You are about to drop the `Stat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Stat";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "RandomUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "query" TEXT
);

-- CreateTable
CREATE TABLE "RandomStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "problem" INTEGER NOT NULL,
    "tier" INTEGER NOT NULL,
    "time" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "submittedAfter" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    CONSTRAINT "RandomStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RandomUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RandomUser_id_key" ON "RandomUser"("id");
