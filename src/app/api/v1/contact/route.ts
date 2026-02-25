import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { ContactMessageUseCases } from "@/core/application/use-cases/contact-message.use-case";
import { ContactMessagePrismaRepository } from "@/infrastructure/repositories/contact-message-prisma.repository";

const contactUseCases = new ContactMessageUseCases(new ContactMessagePrismaRepository());

/**
 * @swagger
 * /api/v1/contact:
 *   get:
 *     summary: 문의 메시지 전체 목록 조회 (어드민)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *   post:
 *     summary: 새로운 문의 메시지 제출 (퍼블릭)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: 메시지 저장 성공
 */
/**
 * 문의 요청 목록 전체를 확인하는 핸들러입니다 (Admin 권한 필요).
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 문의 메시지 전체 배열 리스트 포함 응답
 */
async function getHandler(req: NextRequest) {
  const messages = await contactUseCases.getAllMessages();
  return successResponse(messages);
}

/**
 * 일반 사용자가 사이트에서 관리자에게 정보를 보내는 핸들러입니다 (퍼블릭 엔드포인트).
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 생성된 문의 메시지 정보 및 확인 처리 응답
 */
async function postHandler(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.email || !body.message) {
    return errorResponse("Name, email, and message are required fields", 400);
  }

  const newMessage = await contactUseCases.createMessage(body);
  return successResponse(newMessage, "Message captured successfully", 201);
}

export const GET = withApiHandler(getHandler, { requireAuth: true, allowedRoles: ["Admin"] });
export const POST = withApiHandler(postHandler); // Publicly accessible to submit messages
