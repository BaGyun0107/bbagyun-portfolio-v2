import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { StudyUseCases } from "@/core/application/use-cases/study.use-case";
import { StudyPrismaRepository } from "@/infrastructure/repositories/study-prisma.repository";

const studyUseCases = new StudyUseCases(new StudyPrismaRepository());

/**
 * 모든 Study(공부) 목록을 반환하는 핸들러입니다.
 */
async function getHandler(req: NextRequest) {
  const studies = await studyUseCases.getAllStudies();
  return successResponse(studies);
}

/**
 * 새로운 Study(공부)를 생성하는 핸들러입니다.
 */
async function postHandler(req: NextRequest) {
  const body = await req.json();
  const requiredFields = ["slug", "title", "description", "iconName", "category", "techStack", "status", "overview"];
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    return errorResponse(`필수 항목이 누락되었습니다: ${missing.join(", ")}`, 400);
  }

  const newStudy = await studyUseCases.createStudy(body);
  return successResponse(newStudy, "Study created successfully", 201);
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler, { requireAuth: true, allowedRoles: ["Admin", "Editor"] });
