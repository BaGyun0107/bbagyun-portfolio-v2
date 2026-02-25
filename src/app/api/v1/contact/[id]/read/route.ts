import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { ContactMessageUseCases } from "@/core/application/use-cases/contact-message.use-case";
import { ContactMessagePrismaRepository } from "@/infrastructure/repositories/contact-message-prisma.repository";

const contactUseCases = new ContactMessageUseCases(new ContactMessagePrismaRepository());

/**
 * @swagger
 * /api/v1/contact/{id}/read:
 *   put:
 *     summary: 문의 메시지 읽음 처리
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 */
/**
 * 클라이언트로부터 받은 메시지의 읽음 상태를 토글하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 파라미터 (id 포함)
 * @returns {Promise<Response>} 처리 결과
 */
async function putHandler(req: NextRequest, params: Promise<{ id: string }>) {
  try {
    const { id } = await params;
    const updated = await contactUseCases.markAsRead(id);
    return successResponse(updated, "Message marked as read");
  } catch(error) {
    const e = error as Error;
    return errorResponse(e.message || "Failed to update", 400);
  }
}

export const PUT = withApiHandler(putHandler, { requireAuth: true, allowedRoles: ["Admin"] });
