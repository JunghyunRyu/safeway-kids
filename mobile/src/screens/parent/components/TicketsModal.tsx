import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";
import { SupportTicket } from "../../../api/support";

function getTicketStatusColor(status: string) {
  switch (status) {
    case "open": return "#3B82F6";
    case "in_progress": return "#F59E0B";
    case "resolved": return "#10B981";
    case "closed": return "#9CA3AF";
    default: return Colors.textSecondary;
  }
}

function getTicketStatusLabel(status: string) {
  switch (status) {
    case "open": return "접수";
    case "in_progress": return "처리 중";
    case "resolved": return "해결";
    case "closed": return "종료";
    default: return status;
  }
}

interface TicketsModalProps {
  visible: boolean;
  loading: boolean;
  tickets: SupportTicket[];
  onClose: () => void;
}

export default function TicketsModal({ visible, loading, tickets, onClose }: TicketsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>내 문의 내역</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="내 문의 내역 닫기">
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          {loading ? (
            <Text style={{ textAlign: "center", color: Colors.textSecondary, paddingVertical: Spacing.xl }}>
              불러오는 중...
            </Text>
          ) : tickets.length === 0 ? (
            <Text style={{ textAlign: "center", color: Colors.textSecondary, paddingVertical: Spacing.xl }}>
              문의 내역이 없습니다.
            </Text>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 400 }}
              renderItem={({ item: ticket }) => (
                <View style={styles.ticketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                    <Text style={styles.ticketDate}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("ko-KR") : ""}
                    </Text>
                  </View>
                  <View style={[styles.ticketBadge, { backgroundColor: getTicketStatusColor(ticket.status) + "20" }]}>
                    <Text style={[styles.ticketBadgeText, { color: getTicketStatusColor(ticket.status) }]}>
                      {getTicketStatusLabel(ticket.status)}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  ticketSubject: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  ticketDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ticketBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginLeft: Spacing.sm,
  },
  ticketBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});
