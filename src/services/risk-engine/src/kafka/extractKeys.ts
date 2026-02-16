import type { AnyEvent } from "../validation/eventSchemas.js";
import { TOPICS, type TopicName } from "../validation/eventSchemas.js";

export function extractMerchantOrder(
  topic: TopicName,
  event: AnyEvent
): { merchantId: string | null; orderId: string | null } {
  if (topic === TOPICS.orders || topic === TOPICS.disputes) {
    const data = (event as any).data;
    return {
      merchantId: typeof data?.merchant_id === "string" ? data.merchant_id : null,
      orderId: typeof data?.order_id === "string" ? data.order_id : null,
    };
  }

  if (topic === TOPICS.payments) {
    const data = (event as any).data;
    return {
      merchantId: typeof data?.merchantId === "string" ? data.merchantId : null,
      orderId: typeof data?.orderId === "string" ? data.orderId : null,
    };
  }

  return { merchantId: null, orderId: null };
}