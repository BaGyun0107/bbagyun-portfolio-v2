import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { StudyUseCases } from "@/core/application/use-cases/study.use-case";
import { StudyPrismaRepository } from "@/infrastructure/repositories/study-prisma.repository";

const studyUseCases = new StudyUseCases(new StudyPrismaRepository());

async function getHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const study = await studyUseCases.getStudyBySlug(slug);
  
  if (!study) {
    return errorResponse("Study not found", 404);
  }
  return successResponse(study);
}

async function patchHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const studyData = await req.json();

  const study = await studyUseCases.getStudyBySlug(slug);
  if (!study) {
    return errorResponse("Study not found", 404);
  }

  const updatedStudy = await studyUseCases.updateStudy(study.id, studyData);
  return successResponse(updatedStudy, "Study updated successfully");
}

async function deleteHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;

  const study = await studyUseCases.getStudyBySlug(slug);
  if (!study) {
    return errorResponse("Study not found", 404);
  }

  await studyUseCases.deleteStudy(study.id);
  return successResponse(null, "Study deleted successfully");
}

export const GET = withApiHandler(getHandler);
export const PATCH = withApiHandler(patchHandler, { requireAuth: true, allowedRoles: ["Admin", "Editor"] });
export const DELETE = withApiHandler(deleteHandler, { requireAuth: true, allowedRoles: ["Admin"] });
