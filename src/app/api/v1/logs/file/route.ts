import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse } from "@/core/application/utils/api-response.util";
import fs from "fs";
import path from "path";

/**
 * @swagger
 * /api/v1/logs/file:
 *   get:
 *     summary: 시스템 실시간 로그 파일 조회
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *         description: 가져올 최근 로그 라인 수 (기본 100)
 *     responses:
 *       200:
 *         description: 로그 파일 조회 성공
 */
/**
 * winston에 의해 기록된 파일 로그(combined.log)를 읽어와서 일부를 반환하는 엔드포인트입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 로그 문자열 배열을 포함한 응답
 */
async function getHandler(req: NextRequest) {
  const url = new URL(req.url);
  const linesParam = url.searchParams.get("lines");
  const numLines = linesParam ? parseInt(linesParam, 10) : 200;

  const logFilePath = path.join(process.cwd(), "logs", "combined.log");
  
  if (!fs.existsSync(logFilePath)) {
    return successResponse({ logs: [] });
  }

  try {
    const fileContent = fs.readFileSync(logFilePath, "utf8");
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // 가져올 라인 수만큼 어레이의 뒷부분 추출
    const recentLines = lines.slice(-numLines);
    
    return successResponse({ logs: recentLines });
  } catch (error) {
    throw new Error("Failed to read combined.log file");
  }
}

export const GET = withApiHandler(getHandler, { requireAuth: true, allowedRoles: ["Admin"] });
