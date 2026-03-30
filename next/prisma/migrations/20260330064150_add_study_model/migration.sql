-- CreateTable
CREATE TABLE "studies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tech_stack" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "period" TEXT,
    "content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "read_time" TEXT NOT NULL,
    "feature_id" TEXT,
    "study_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "insights_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "insights_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_insights" ("content", "created_at", "date", "excerpt", "feature_id", "id", "read_time", "slug", "title", "updated_at") SELECT "content", "created_at", "date", "excerpt", "feature_id", "id", "read_time", "slug", "title", "updated_at" FROM "insights";
DROP TABLE "insights";
ALTER TABLE "new_insights" RENAME TO "insights";
CREATE UNIQUE INDEX "insights_slug_key" ON "insights"("slug");
CREATE INDEX "insights_date_idx" ON "insights"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "studies_slug_key" ON "studies"("slug");
