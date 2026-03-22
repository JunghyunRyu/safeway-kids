import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import InfoRow from "../../components/InfoRow";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { createSupportTicket } from "../../api/support";
import { showError } from "../../utils/toast";

const ROLE_LABELS: Record<string, string> = {
  parent: "학부모",
  driver: "기사",
  safety_escort: "안전도우미",
  academy_admin: "학원 관리자",
  platform_admin: "플랫폼 관리자",
};

const ROLE_COLORS: Record<string, string> = {
  parent: Colors.roleParent,
  driver: Colors.roleDriver,
  safety_escort: Colors.roleEscort,
  academy_admin: Colors.roleAdmin,
  platform_admin: Colors.roleAdmin,
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [showChildProfile, setShowChildProfile] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({ category: "일반", subject: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const roleColor = user ? (ROLE_COLORS[user.role] ?? Colors.primary) : Colors.primary;
  const initials = user?.name ? user.name.charAt(0) : "?";

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("로그아웃 하시겠습니까?")) signOut();
    } else {
      Alert.alert(t("auth.logout"), "정말 로그아웃 하시겠습니까?", [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.confirm"), style: "destructive", onPress: signOut },
      ]);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportForm.subject.trim() || !supportForm.description.trim()) {
      Alert.alert("입력 오류", "제목과 내용을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await createSupportTicket(supportForm);
      Alert.alert("접수 완료", "문의가 접수되었습니다. 빠르게 답변드리겠습니다.");
      setShowSupportModal(false);
      setSupportForm({ category: "일반", subject: "", description: "" });
    } catch {
      showError("문의 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // Lazy-load sub-screens to avoid circular dependencies
  if (showChildProfile) {
    const ChildProfileScreen = require("./ChildProfileScreen").default;
    return (
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => setShowChildProfile(false)}
          style={styles.subScreenBack}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.subScreenBackText}>프로필로 돌아가기</Text>
        </Pressable>
        <ChildProfileScreen />
      </View>
    );
  }

  if (showNotifSettings) {
    const NotificationSettingsScreen = require("./NotificationSettingsScreen").default;
    return (
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => setShowNotifSettings(false)}
          style={styles.subScreenBack}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.subScreenBackText}>프로필로 돌아가기</Text>
        </Pressable>
        <NotificationSettingsScreen />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      {/* 아바타 영역 */}
      <View style={[styles.avatarSection, { backgroundColor: roleColor + "12" }]}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {user && (
          <>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor + "20" }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 정보 카드 */}
      {user && (
        <View style={[styles.infoCard, Shadows.sm]}>
          <Text style={styles.infoCardTitle}>계정 정보</Text>
          <InfoRow icon="call-outline" label="전화번호" value={user.phone} />
          {user.email ? (
            <InfoRow icon="mail-outline" label="이메일" value={user.email} />
          ) : null}
          <InfoRow
            icon="shield-checkmark-outline"
            label="역할"
            value={ROLE_LABELS[user.role] ?? user.role}
          />
        </View>
      )}

      {/* 메뉴 카드 — P2-37, P2-41, P2-57 */}
      {user && (user.role === "parent" || user.role === "student") && (
        <View style={[styles.infoCard, Shadows.sm]}>
          <Text style={styles.infoCardTitle}>설정</Text>
          {user.role === "parent" && (
            <Pressable style={styles.menuRow} onPress={() => setShowChildProfile(true)}>
              <Ionicons name="people-outline" size={20} color={Colors.primary} />
              <Text style={styles.menuText}>자녀 관리</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
            </Pressable>
          )}
          <Pressable style={styles.menuRow} onPress={() => setShowNotifSettings(true)}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            <Text style={styles.menuText}>알림 설정</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => setShowSupportModal(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
            <Text style={styles.menuText}>문의하기</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </Pressable>
        </View>
      )}

      {/* 앱 정보 카드 */}
      <View style={[styles.infoCard, Shadows.sm]}>
        <Text style={styles.infoCardTitle}>앱 정보</Text>
        <InfoRow icon="information-circle-outline" label="버전" value="1.0.0" />
        <InfoRow icon="school-outline" label="서비스" value="Safeway Kids" />
      </View>

      {/* 로그아웃 버튼 */}
      <Pressable
        style={styles.logoutBtn}
        onPress={handleLogout}

      >
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>{t("auth.logout")}</Text>
      </Pressable>

      {/* P2-57: 문의하기 모달 */}
      <Modal visible={showSupportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>문의하기</Text>
              <Pressable onPress={() => setShowSupportModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalLabel}>카테고리</Text>
            <View style={styles.categoryRow}>
              {["일반", "운행", "결제", "안전"].map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    supportForm.category === cat && styles.categoryBtnActive,
                  ]}
                  onPress={() => setSupportForm({ ...supportForm, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryBtnText,
                      supportForm.category === cat && styles.categoryBtnTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.modalLabel}>제목</Text>
            <TextInput
              style={styles.modalInput}
              value={supportForm.subject}
              onChangeText={(v) => setSupportForm({ ...supportForm, subject: v })}
              placeholder="문의 제목을 입력하세요"
            />
            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 100, textAlignVertical: "top" }]}
              value={supportForm.description}
              onChangeText={(v) => setSupportForm({ ...supportForm, description: v })}
              placeholder="문의 내용을 입력하세요"
              multiline
            />
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
              onPress={handleSupportSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? "접수 중..." : "문의 접수"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  avatarSection: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  rolePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  roleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  infoCardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
    minHeight: 52,
  },
  logoutText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.danger,
  },

  // Menu rows (P2-37, P2-41, P2-57)
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },

  // Sub-screen back button
  subScreenBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subScreenBackText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary,
  },

  // Support modal (P2-57)
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
  modalLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: Colors.textInverse,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textInverse,
  },
});
