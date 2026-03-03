import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { InsightUseCases } from "@/core/application/use-cases/insight.use-case";
import { InsightPrismaRepository } from "@/infrastructure/repositories/insight-prisma.repository";

const insightUseCases = new InsightUseCases(new InsightPrismaRepository());

/**
 * @swagger
 * /api/v1/insights/{slug}:
 *   get:
 *     summary: Get insight by slug
 *     tags: [Insights]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update insight
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *   delete:
 *     summary: Delete insight
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
async function getHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const insight = await insightUseCases.getInsightBySlug(slug);
  if (!insight) {
    return errorResponse("인사이트를 찾을 수 없습니다.", 404);
  }
  return successResponse(insight);
}

async function putHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const insight = await insightUseCases.getInsightBySlug(slug);
  if (!insight) {
    return errorResponse("인사이트를 찾을 수 없습니다.", 404);
  }

  const body = await req.json();
  const updatedInsight = await insightUseCases.updateInsight(insight.id, body);
  return successResponse(updatedInsight, "Insight updated successfully");
}

async function deleteHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const insight = await insightUseCases.getInsightBySlug(slug);
  if (!insight) {
    return errorResponse("인사이트를 찾을 수 없습니다.", 404);
  }

  await insightUseCases.deleteInsight(insight.id);
  return successResponse(null, "Insight deleted successfully");
}

const adminOptions = { requireAuth: true, allowedRoles: ["Admin", "Editor"] };

export const GET = withApiHandler(getHandler);
export const PUT = withApiHandler(putHandler, adminOptions);
export const DELETE = withApiHandler(deleteHandler, adminOptions);
