import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { Invoice, preparePayment, confirmPayment } from "../../../api/billing";

/**
 * Custom hook encapsulating the payment flow:
 * prepare → confirm dialog → confirm payment → refresh.
 */
export function usePaymentFlow(onSuccess: () => void) {
  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePayPress = useCallback(
    async (invoice: Invoice) => {
      try {
        setPayingId(invoice.id);
        // Step 1: Prepare payment
        const prepared = await preparePayment(Number(invoice.id));

        // Step 2: Show confirmation dialog
        Alert.alert(
          "결제 확인",
          `${invoice.billing_month} 청구서\n금액: ${prepared.amount.toLocaleString("ko-KR")}원\n\n결제를 진행하시겠습니까?`,
          [
            { text: "취소", style: "cancel", onPress: () => setPayingId(null) },
            {
              text: "결제하기",
              style: "default",
              onPress: async () => {
                try {
                  // Step 3: Confirm payment (simulated — in production this
                  // would go through the Toss Payments widget)
                  await confirmPayment(
                    "test_key",
                    prepared.order_id,
                    prepared.amount,
                  );
                  Alert.alert("결제 완료", "결제가 성공적으로 처리되었습니다.");
                  // Step 4: Refresh list
                  onSuccess();
                } catch {
                  Alert.alert("결제 실패", "결제 처리 중 오류가 발생했습니다.");
                } finally {
                  setPayingId(null);
                }
              },
            },
          ],
          { cancelable: false },
        );
      } catch {
        Alert.alert("오류", "결제 준비 중 오류가 발생했습니다.");
        setPayingId(null);
      }
    },
    [onSuccess],
  );

  return { payingId, handlePayPress };
}
