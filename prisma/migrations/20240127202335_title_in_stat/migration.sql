/*
  Warnings:

  - Added the required column `title` to the `Stat` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "problem" INTEGER NOT NULL,
    "tier" INTEGER NOT NULL,
    "time" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "submittedAfter" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    CONSTRAINT "Stat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stat" ("id", "problem", "submittedAfter", "success", "tier", "time", "userId") SELECT "id", "problem", "submittedAfter", "success", "tier", "time", "userId" FROM "Stat";
DROP TABLE "Stat";
ALTER TABLE "new_Stat" RENAME TO "Stat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
