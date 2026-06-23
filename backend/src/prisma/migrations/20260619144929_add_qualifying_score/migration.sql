-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "submissionData" TEXT NOT NULL DEFAULT '{}',
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualifyingScore" INTEGER NOT NULL DEFAULT 0,
    "qualifyingTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormResponse" ("createdAt", "formId", "id", "isQualified", "submissionData") SELECT "createdAt", "formId", "id", "isQualified", "submissionData" FROM "FormResponse";
DROP TABLE "FormResponse";
ALTER TABLE "new_FormResponse" RENAME TO "FormResponse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
