import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import InfoRow from "../../components/InfoRow";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { createSupportTicket, getMyTickets, SupportTicket } from "../../api/support";
import { listConsents, withdrawConsent, Consent } from "../../api/compliance";
import { showError } from "../../utils/toast";
import ProfileHeader from "./components/ProfileHeader";
import SettingsMenu from "./components/SettingsMenu";
import TicketsModal from "./components/TicketsModal";
import SupportFormModal, { SupportFormData } from "./components/SupportFormModal";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [showChildProfile, setShowChildProfile] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState<SupportFormData>({ category: "일반", subject: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingConsent, setWithdrawingConsent] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

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

  const handleWithdrawConsent = () => {
    Alert.alert(
      "동의 철회",
      "모든 개인정보 수집 동의를 철회하시겠습니까?\n철회 후 일부 서비스 이용이 제한될 수 있습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "철회",
          style: "destructive",
          onPress: async () => {
            setWithdrawingConsent(true);
            try {
              const consents = await listConsents();
              const active = consents.filter((c: Consent) => c.withdrawn_at === null);
              if (active.length === 0) {
                Alert.alert("알림", "철회할 동의 내역이 없습니다.");
                return;
              }
              let failCount = 0;
              for (const consent of active) {
                try {
                  await withdrawConsent(consent.id);
                } catch {
                  failCount++;
                }
              }
              if (failCount === 0) {
                Alert.alert("철회 완료", "모든 동의가 철회되었습니다.");
              } else {
                Alert.alert("부분 완료", `${active.length - failCount}건 철회, ${failCount}건 실패`);
              }
            } catch {
              showError("동의 철회에 실패했습니다.");
            } finally {
              setWithdrawingConsent(false);
            }
          },
        },
      ]
    );
  };

  const handleShowTickets = async () => {
    setShowTicketsModal(true);
    setLoadingTickets(true);
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch {
      showError("문의 내역을 불러올 수 없습니다.");
    } finally {
      setLoadingTickets(false);
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
          accessibilityRole="button"
          accessibilityLabel="프로필로 돌아가기"
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
          accessibilityRole="button"
          accessibilityLabel="프로필로 돌아가기"
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
      <ProfileHeader user={user} />

      {/* 메뉴 카드 -- P2-37, P2-41, P2-57 */}
      {user && (user.role === "parent" || user.role === "student") && (
        <SettingsMenu
          userRole={user.role}
          withdrawingConsent={withdrawingConsent}
          onShowChildProfile={() => setShowChildProfile(true)}
          onShowNotifSettings={() => setShowNotifSettings(true)}
          onShowSupportModal={() => setShowSupportModal(true)}
          onShowTickets={handleShowTickets}
          onWithdrawConsent={handleWithdrawConsent}
        />
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
        accessibilityRole="button"
        accessibilityLabel="로그아웃"
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>{t("auth.logout")}</Text>
      </Pressable>

      <TicketsModal
        visible={showTicketsModal}
        loading={loadingTickets}
        tickets={tickets}
        onClose={() => setShowTicketsModal(false)}
      />

      <SupportFormModal
        visible={showSupportModal}
        form={supportForm}
        submitting={submitting}
        onChangeForm={setSupportForm}
        onSubmit={handleSupportSubmit}
        onClose={() => setShowSupportModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
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
});
