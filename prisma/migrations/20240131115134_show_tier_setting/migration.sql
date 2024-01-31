/*
  Warnings:

  - Added the required column `showTier` to the `RandomUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RandomUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "query" TEXT,
    "showTier" BOOLEAN NOT NULL
);
INSERT INTO "new_RandomUser" ("handle", "id", "query") SELECT "handle", "id", "query" FROM "RandomUser";
DROP TABLE "RandomUser";
ALTER TABLE "new_RandomUser" RENAME TO "RandomUser";
CREATE UNIQUE INDEX "RandomUser_id_key" ON "RandomUser"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
