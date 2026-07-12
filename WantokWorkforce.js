import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl, Modal, Linking, Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { COLORS as THEME_COLORS, SPACING, RADII, TYPOGRAPHY } from './theme';
import * as WebBrowser from 'expo-web-browser';
import * as LinkingExpo from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import categories from "./categories.json";

WebBrowser.maybeCompleteAuthSession();

const { width, height: screenHeight } = Dimensions.get("window");
const isDesktop = width > 1024;
const isTablet = width> 768;
const MAX_WIDTH = 1280;
const CONTENT_PADDING = isDesktop ? 40 : 16;
const API_BASE = (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL) || ((typeof window !== "undefined" && window.location.hostname === "localhost") ? "http://localhost:3000/api" : "/api");
console.log('🔗 Active Backend Pipeline API Path Set to:', API_BASE);

const COLORS = THEME_COLORS;

const ResponsiveContainer = ({ children }) => (
  <View style={{ width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", paddingHorizontal: CONTENT_PADDING }}>
    {children}
  </View>
);

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "booking", label: "Bookings", icon: "📅" },
  { key: "messages", label: "Inbox", icon: "💬" },
  { key: "trust", label: "Trust", icon: "🛡️" },
  { key: "profile", label: "Profile", icon: "👤" },
];

const StarRating = ({ rating }) => {
  const stars = Math.round(rating);
  return (
    <View style={{ flexDirection: "row" }}>
      <Text style={{ color: COLORS.accent, fontSize: TYPOGRAPHY.caption.fontSize }}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </Text>
    </View>
  );
};

const Heading = ({ level = 1, style, children, ...props }) => {
  const headingStyle = TYPOGRAPHY[`h${level}`] || TYPOGRAPHY.h1;
  return <Text style={[headingStyle, { color: COLORS.text }, style]} {...props}>{children}</Text>;
};

const Body = ({ variant = 'body', style, children, ...props }) => {
  const bodyStyle = TYPOGRAPHY[variant] || TYPOGRAPHY.body;
  return <Text style={[bodyStyle, { color: COLORS.text }, style]} {...props}>{children}</Text>;
};

const Caption = ({ style, children, ...props }) => (
  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }, style]} {...props}>{children}</Text>
);

const ThemedButton = ({ onPress, title, variant = 'primary', style, textStyle, loading, ...props }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading}
    style={[
      {
        backgroundColor: variant === 'primary' ? COLORS.primary : COLORS.slate,
        paddingVertical: SPACING.md,
        borderRadius: RADII.md,
        alignItems: 'center',
        justifyContent: 'center',
      },
      style
    ]}
    {...props}
  >
    <Text style={[TYPOGRAPHY.button, { color: COLORS.white }, textStyle]}>
      {loading ? '...' : title}
    </Text>
  </TouchableOpacity>
);

const TrustBadge = () => (
  <LinearGradient
    colors={[COLORS.primary, COLORS.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      borderRadius: RADII.pill,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs / 2,
    }}
>
    <Body style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize - 1 }}>✓</Body>
    <Body style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: 'Inter_600SemiBold' }}>Verified</Body>
  </LinearGradient>
);

// ─── SCREENS ───────────────────────────────────────────────────────────────

function ProviderVouchingForm({ user, onVouchSubmitted, showAlert }) {
  const [gatekeeper, setGatekeeper] = useState({ name: '', role: '', contact: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!gatekeeper.name || !gatekeeper.role || !gatekeeper.contact) {
      showAlert("Please fill in all gatekeeper details.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/v1/providers/vouch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify(gatekeeper)
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Verification request sent to community gatekeeper!");
        onVouchSubmitted();
      } else {
        showAlert(data.error || "Submission failed.");
      }
    } catch (err) {
      showAlert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.md, elevation: 4, marginTop: SPACING.md }}>
      <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, marginBottom: SPACING.sm }}>🤝 Get Verified (Optional Extra)</Text>
      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginBottom: SPACING.md }}>Optional: Verify your skills via a community leader (Church, Village, or School) for a higher trust score.</Text>
      <TextInput placeholder="Gatekeeper Name (e.g. Pastor John)" value={gatekeeper.name} onChangeText={(v) => setGatekeeper({...gatekeeper, name: v})} style={{ backgroundColor: COLORS.bg, borderRadius: RADII.sm, padding: SPACING.sm, marginBottom: SPACING.sm }} />
      <TextInput placeholder="Gatekeeper Role (e.g. Village Councillor)" value={gatekeeper.role} onChangeText={(v) => setGatekeeper({...gatekeeper, role: v})} style={{ backgroundColor: COLORS.bg, borderRadius: RADII.sm, padding: SPACING.sm, marginBottom: SPACING.sm }} />
      <TextInput placeholder="Contact Phone / Email" value={gatekeeper.contact} onChangeText={(v) => setGatekeeper({...gatekeeper, contact: v})} style={{ backgroundColor: COLORS.bg, borderRadius: RADII.sm, padding: SPACING.sm, marginBottom: SPACING.md }} />
      <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: COLORS.primary, borderRadius: RADII.md, paddingVertical: SPACING.md, alignItems: "center" }}>
        <Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold" }}>{isSubmitting ? "SENDING..." : "SUBMIT FOR VALIDATION"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProviderFinancialDashboard({ user, showAlert }) {
  const [ledger, setLedger] = useState({ metrics: { totalEarned: 0, fundsInEscrow: 0, withdrawnToWallet: 0 }, history: [] });
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/providers/ledger`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) setLedger(data.data);
    } catch (err) {
      console.error("Ledger fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedger(); }, []);

  if (loading) return <Text style={{ textAlign: 'center', padding: SPACING.md }}>Loading Ledger...</Text>;

  return (
    <View style={{ gap: SPACING.md }}>
      <View style={{ backgroundColor: COLORS.primaryDark, borderRadius: RADII.lg, padding: SPACING.lg, flexDirection: isDesktop ? "row" : "column", gap: SPACING.lg }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium" }}>TOTAL EARNED (PGK)</Text>
          <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h1.fontSize + 4, fontFamily: "Poppins_700Bold", marginTop: 8 }}>K{Number(ledger?.metrics?.totalEarned || 0).toFixed(2)}</Text>
        </View>
        <View style={{ height: isDesktop ? 60 : 1, width: isDesktop ? 1 : "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium" }}>IN ESCROW</Text>
          <Text style={{ color: COLORS.accent, fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_600SemiBold", marginTop: SPACING.xs }}>K{Number(ledger?.metrics?.fundsInEscrow || 0).toFixed(2)}</Text>
        </View>
        <View style={{ height: isDesktop ? 60 : 1, width: isDesktop ? 1 : "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium" }}>MOBILE WALLET</Text>
          <Text style={{ color: COLORS.success, fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_600SemiBold", marginTop: SPACING.xs }}>K{Number(ledger?.metrics?.withdrawnToWallet || 0).toFixed(2)}</Text>
        </View>
      </View>

      <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, marginTop: 8 }}>📜 Permanent Employment Record</Text>
      {ledger.history?.length === 0 ? (
        <View style={{ padding: SPACING.xl * 1.25, alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADII.md, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border }}>
          <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>Your completed jobs will automatically build your verified work history record here.</Text>
        </View>
      ) : (
        <View style={{ gap: SPACING.sm }}>
          {ledger?.history?.map((job) => (
            <View key={job?.id || Math.random()} style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, elevation: 2, borderLeftWidth: 6, borderLeftColor: COLORS.primary }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm }}>
                <View>
                  <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text }}>{job?.service_type}</Text>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs / 2 }}>Client: {job?.customer_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_700Bold", color: COLORS.primary }}>K{Number(job?.price).toFixed(2)}</Text>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.textLight, textAlign: 'right' }}>{new Date(job?.completed_at || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.sm }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs * 1.5 }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize }}>⭐</Text>
                  <Text style={{ fontFamily: "Inter_600SemiBold", color: COLORS.accent }}>{job?.feedback_rating || 5.0} Rating</Text>
                </View>
                <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: SPACING.sm * 1.25, paddingVertical: SPACING.xs, borderRadius: RADII.lg }}>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: COLORS.primaryDark }}>VERIFIED RECORD</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function HomeScreen({ onNavigate, currentUser, user, onUpdateUser, showAlert }) {
  const getDynamicGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour>= 5 && currentHour < 12) return "Good morning";
    if (currentHour>= 12 && currentHour < 17) return "Good afternoon";
    if (currentHour>= 17 && currentHour < 21) return "Good evening";
    return "Good night";
  };
  const fullCustomerName = user?.name || "";
  const customerFirstName = fullCustomerName ? fullCustomerName.split(" ")[0] : "";
  // Hooks MUST be at the top level
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Provider specific states
  const [vStatus, setVStatus] = useState({ verified: false, vouch_status: 'none' });
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({
    primary_skill: user?.primary_skill || '',
    skills_specialization: '',
    years_experience: '',
    hourly_rate: user?.hourly_rate?.toString() || '',
    operating_location: user?.location_name || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchNearbyProviders = async () => {
    setIsSearching(true);

    const SYNONYM_EXTENSIONS = {
      'law': 'Legal',
      'lawyer': 'Legal',
      'lawyers': 'Legal',
      'fintech': 'FinTech',
      'finance': 'FinTech',
      'agritech': 'AgriTech',
      'agriculture': 'AgriTech'
    };

    try {
      // Fetch base providers list safely
      const url = `${API_BASE}/match/nearby`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: "Invalid response from server" }));
      const workers = data.workers || [];

      if (response.ok) {
        const rawInput = (searchText || '').trim();
        const normalizedInput = rawInput.toLowerCase();

        // Standardize search criteria: Append synonym root if matched
        const extendedKeyword = SYNONYM_EXTENSIONS[normalizedInput]
          ? `${rawInput} ${SYNONYM_EXTENSIONS[normalizedInput]}`
          : rawInput;

        const finalQuery = extendedKeyword.toLowerCase();

        if (!rawInput) {
          // Filter out admins even when the search bar is empty
          const activeProvidersOnly = workers?.filter(worker => {
            // 1. Strict Exclusions
            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';
            const isNotGeneralTrade = (worker.category || '').toLowerCase().trim() !== 'general trade';
            const isNotAdmin = (worker.role || '').toLowerCase() !== 'admin' &&
                               (worker.role || '').toLowerCase() !== 'master admin' &&
                               !worker.isAdmin;
            if (!isNotMockProvider || !isNotGeneralTrade || !isNotAdmin) {
              return false; // Permanently drop them before checking search words
            }
            return true;
          });
          setNearbyWorkers(activeProvidersOnly);
        } else if (rawInput.length < 3) {
          const strictShortResults = workers?.filter(worker => {
            // 1. Strict Exclusions
            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';
            const isNotGeneralTrade = (worker.category || '').toLowerCase().trim() !== 'general trade';
            const isNotAdmin = (worker.role || '').toLowerCase() !== 'admin' &&
                               (worker.role || '').toLowerCase() !== 'master admin' &&
                               !worker.isAdmin;
            if (!isNotMockProvider || !isNotGeneralTrade || !isNotAdmin) {
              return false; // Permanently drop them before checking search words
            }
            const matchesSearchCriteria = (worker.name || '').toLowerCase().startsWith(normalizedInput) ||
                                  (worker.role || '').toLowerCase().startsWith(normalizedInput) ||
                                  (worker.category || '').toLowerCase().startsWith(normalizedInput);
            return matchesSearchCriteria;
          });
          setNearbyWorkers(strictShortResults);
        } else {
          const fuzzyResults = workers?.filter(worker => {
            // 1. Strict Exclusions
            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';
            const isNotGeneralTrade = (worker.category || '').toLowerCase().trim() !== 'general trade';
            const isNotAdmin = (worker.role || '').toLowerCase() !== 'admin' &&
                               (worker.role || '').toLowerCase() !== 'master admin' &&
                               !worker.isAdmin;
            if (!isNotMockProvider || !isNotGeneralTrade || !isNotAdmin) {
              return false; // Permanently drop them before checking search words
            }

            // Run the deep fuzzy, synonym, and stemming filter when input is 3 or more characters
            const searchTargetText = [
              worker.name,
              worker.role,
              worker.bio,
              worker.category,
              ...(worker.skills || [])
            ].join(' ').toLowerCase();

            // Standard sub-string index check
            if (searchTargetText.includes(finalQuery)) return true;

            // Simple Levenshtein distance / typo handling hook for broken words
            const words = finalQuery.split(/\s+/);
            return words.every(word => {
              if (word.length < 3) return searchTargetText.includes(word);
              // Returns true if a keyword segment closely matches a chunk of the profile text
              return searchTargetText.split(/\s+/).some(targetWord => {
                if (targetWord.includes(word) || word.includes(targetWord)) return true;
                // Fallback for single character typos (e.g., 'eletric' vs 'electric')
                let distance = 0;
                for (let i = 0; i < Math.min(word.length, targetWord?.length); i++) {
                  if (word[i] !== targetWord[i]) distance++;
                }
                return distance <= 1 && Math.abs(word.length - targetWord?.length) <= 1;
              });
            });
          });

          setNearbyWorkers(fuzzyResults);
        }
      } else {
        setNearbyWorkers([]);
      }
    } catch (error) {
      console.error("Match fetch failed:", error);
      setNearbyWorkers([]);
    } finally {
      setIsSearching(false);
    }
  };
  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/v1/providers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showAlert("Profile updated successfully!");
        setIsUpdateModalVisible(false);
        onUpdateUser({ ...user, primary_skill: profileForm.primary_skill, hourly_rate: profileForm.hourly_rate });
      } else {
        showAlert(data.error || "Failed to update profile");
      }
    } catch (error) {
      showAlert("Network error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchVerification = async () => {
    if (currentUser !== 'provider') return;
    try {
      const res = await fetch(`${API_BASE}/v1/providers/verification-status`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) setVStatus(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (currentUser === 'provider') fetchVerification();
  }, [currentUser]);

  useEffect(() => {
    if (!searchText && !selectedCategory) {
      setNearbyWorkers([]);
    }
  }, [searchText, selectedCategory]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textMuted }}>Initializing secure session...</Text>
      </View>
    );
  }

  if (currentUser === "provider") {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
          <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
          <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ padding: SPACING.lg, paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs * 1.5 }}>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: TYPOGRAPHY.bodySmall.fontSize }}>Welcome Back, Provider</Text>
                    {vStatus?.verified && (
                      <View style={{ backgroundColor: COLORS.accent, borderRadius: RADII.sm / 2, paddingHorizontal: SPACING.xs }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 2, fontFamily: "Poppins_700Bold", color: COLORS.white }}>VERIFIED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_700Bold", marginTop: SPACING.xs }}>Your Dashboard</Text>
                </View>
                <TouchableOpacity onPress={() => onNavigate("profile")} style={{ width: 48, height: 48, borderRadius: RADII.lg, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }}>
                  <Text style={{ fontSize: TYPOGRAPHY.h2.fontSize }}>🔧</Text>
                </TouchableOpacity>
              </View>
          </LinearGradient>

            <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md }}>
              <View style={{ flex: isDesktop ? 2 : 1, gap: SPACING.md }}>
                <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.md, elevation: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
                    <View>
                      <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.text }}>Work Status</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: SPACING.xs }}>
            <View style={{ width: 8, height: 8, borderRadius: RADII.sm / 2, backgroundColor: user?.is_available ? COLORS.success : COLORS.textLight, marginRight: 6 }} />
                        <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium", color: user?.is_available ? COLORS.success : COLORS.textMuted }}>{user?.is_available ? "Available for Jobs" : "Busy / Offline"}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={async () => {
                      const newStatus = !user?.is_available;
                      onUpdateUser({ ...user, is_available: newStatus });
                      try {
                        await fetch(`${API_BASE}/auth/availability`, { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` }, body: JSON.stringify({ is_available: newStatus }) });
                      } catch (err) {
                        onUpdateUser({ ...user, is_available: !newStatus });
                        showAlert("Could not update status.");
                      }
                    }} style={{ width: 50, height: 28, borderRadius: RADII.md, backgroundColor: user?.is_available ? COLORS.primary : COLORS.border, padding: SPACING.xs / 2, justifyContent: "center" }}>
                      <View style={{ width: 24, height: 24, borderRadius: RADII.md, backgroundColor: COLORS.white, transform: [{ translateX: user?.is_available ? 22 : 0 }], elevation: 2 }} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.md }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm }}>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.text }}>Trust Score</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_700Bold", color: COLORS.primary }}>{vStatus?.verified ? "98%" : "92%"}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: RADII.sm / 2, overflow: "hidden" }}><View style={{ width: vStatus?.verified ? "98%" : "92%", height: "100%", backgroundColor: COLORS.primary }} /></View>
                </View>

                <ProviderFinancialDashboard user={user} showAlert={showAlert} />
              </View>

              <View style={{ flex: isDesktop ? 1 : 1, gap: SPACING.md }}>
                <View style={{ backgroundColor: COLORS.slate, borderRadius: RADII.lg, padding: SPACING.md }}>
                  <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", marginBottom: SPACING.sm }}>Quick Actions</Text>
                  <TouchableOpacity onPress={() => setIsUpdateModalVisible(true)} style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.sm }}>
                    <Text style={{ color: COLORS.white, textAlign: "center", fontFamily: "Inter_600SemiBold" }}>Update Storefront Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: SPACING.sm, borderRadius: RADII.sm }}>
                    <Text style={{ color: COLORS.white, textAlign: "center", fontFamily: "Inter_600SemiBold" }}>View Marketplace</Text>
                  </TouchableOpacity>
                </View>

                {!vStatus?.verified && vStatus?.vouch_status !== "pending" && (
                  <ProviderVouchingForm user={user} showAlert={showAlert} onVouchSubmitted={fetchVerification} />
                )}
                {vStatus?.vouch_status === "pending" && (
                  <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.md, alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: COLORS.primary }}>
                    <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.primary }}>⏳ Verification Pending</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs, textAlign: "center" }}>Your community gatekeeper request is being reviewed by the Wantok team.</Text>
                  </View>
                )}
              </View>
            </View>

          </View>
        </ScrollView>
        <Modal visible={isUpdateModalVisible} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md }}>
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, width: '100%', maxWidth: 500, padding: SPACING.lg, maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Poppins_600SemiBold', color: COLORS.text, marginBottom: SPACING.xs }}>Update Storefront Profile</Text>
                <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginBottom: SPACING.md }}>Refine your skills for better job matching</Text>

                <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: SPACING.xs * 1.5 }}>PRIMARY TRADE CATEGORY</Text>
                <View style={{ backgroundColor: COLORS.bg, borderRadius: RADII.md, marginBottom: SPACING.md, paddingHorizontal: SPACING.sm * 1.5 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: SPACING.sm * 1.25 }}>
                    {categories?.map((cat) => (
                      <TouchableOpacity
                        key={cat.label}
                        onPress={() => setProfileForm({...profileForm, primary_skill: cat.label})}
                        style={{
                          paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs * 1.5, borderRadius: RADII.lg, marginRight: 8,
                          backgroundColor: profileForm.primary_skill === cat.label ? COLORS.primary : COLORS.white,
                          borderWidth: 1, borderColor: COLORS.border
                        }}
>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_500Medium', color: profileForm.primary_skill === cat.label ? COLORS.white : COLORS.text }}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: SPACING.xs * 1.5 }}>SKILLS & SPECIALIZATIONS</Text>
                <TextInput
                  placeholder="e.g. Commercial wiring, Pipe repair"
                  value={profileForm.skills_specialization}
                  onChangeText={(t) => setProfileForm({...profileForm, skills_specialization: t})}
                  style={{ backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.sm, marginBottom: SPACING.md, fontSize: TYPOGRAPHY.bodySmall.fontSize }}
 />

                <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: SPACING.xs * 1.5 }}>YEARS EXP.</Text>
                    <TextInput
                      keyboardType="numeric"
                      placeholder="5"
                      value={profileForm.years_experience}
                      onChangeText={(t) => setProfileForm({...profileForm, years_experience: t})}
                      style={{ backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.sm, fontSize: TYPOGRAPHY.bodySmall.fontSize }}
 />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: SPACING.xs * 1.5 }}>HOURLY RATE (K)</Text>
                    <TextInput
                      keyboardType="numeric"
                      placeholder="50.00"
                      value={profileForm.hourly_rate}
                      onChangeText={(t) => setProfileForm({...profileForm, hourly_rate: t})}
                      style={{ backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.sm, fontSize: TYPOGRAPHY.bodySmall.fontSize }}
 />
                  </View>
                </View>

                <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: SPACING.xs * 1.5 }}>OPERATING PROVINCE</Text>
                <TextInput
                  placeholder="e.g. National Capital District"
                  value={profileForm.operating_location}
                  onChangeText={(t) => setProfileForm({...profileForm, operating_location: t})}
                  style={{ backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.sm, marginBottom: SPACING.lg, fontSize: TYPOGRAPHY.bodySmall.fontSize }}
 />

                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <TouchableOpacity
                    onPress={() => setIsUpdateModalVisible(false)}
                    style={{ flex: 1, padding: SPACING.md, borderRadius: RADII.md, backgroundColor: COLORS.bg, alignItems: 'center' }}
>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: COLORS.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpdateProfile}
                    disabled={isUpdating}
                    style={{ flex: 2, padding: SPACING.md, borderRadius: RADII.md, backgroundColor: COLORS.primary, alignItems: 'center' }}
>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: COLORS.white }}>{isUpdating ? 'Saving...' : 'Save Configuration'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ paddingTop: 20, paddingBottom: 35 }}>
            <ResponsiveContainer>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{`${getDynamicGreeting()}${customerFirstName ? `, ${customerFirstName}` : "" } 👋`}</Text>
                <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", marginTop: SPACING.xs / 2 }}>Find a Wantok</Text>
              </View>
              <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }} onPress={() => onNavigate("profile")}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>👤</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md - 2, flexDirection: "row", alignItems: "center", gap: SPACING.sm, elevation: 4 }}>
              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>🔍</Text>
              <TextInput value={searchText} onChangeText={setSearchText} placeholder="Search trade or category..." placeholderTextColor={COLORS.textLight} style={{ flex: 1, fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.text, padding: 0 }} onSubmitEditing={fetchNearbyProviders} />
              <TouchableOpacity onPress={fetchNearbyProviders} style={{ backgroundColor: COLORS.primary, borderRadius: RADII.sm, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm * 1.25 }}><Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_500Medium" }}>Search</Text></TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </LinearGradient>

          <ResponsiveContainer>
          <View style={{ paddingVertical: SPACING.md }}>
            {isSearching ? (
              <View style={{ padding: SPACING.xl * 1.25, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>Searching for nearby providers...</Text>
              </View>
            ) : (nearbyWorkers || [])?.length> 0 ? (
              <View style={{ gap: SPACING.sm }}>
                <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.text, marginBottom: SPACING.xs }}>Search Results</Text>
                {nearbyWorkers?.map((worker) => (
                  <WorkerCard key={worker?.id || Math.random()} worker={worker} onPress={() => onNavigate("workerDetail", worker)} />
                ))}
              </View>
            ) : (searchText) ? (
              <View style={{ padding: SPACING.xl * 1.25, alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' }}>
                <Text style={{ color: COLORS.textMuted }}>No results found.</Text>
              </View>
            ) : null}
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
function AdminNavigationShell({ renderScreen }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
    </View>
  );
}

function ProviderNavigationShell({ renderScreen, navigate, activeNav, onboardingComplete }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      {onboardingComplete && (
        <View
          style={{
            backgroundColor: COLORS.white,
            height: Platform.OS === "ios" ? 84 : 68,
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: Platform.OS === "ios" ? 20 : 4,
          }}
>
          {[
            { key: "home", label: "Dashboard", icon: "📊" },
            { key: "booking", label: "Jobs", icon: "🔧" },
            { key: "profile", label: "Account", icon: "👤" },
            { key: "messages", label: "Inbox", icon: "💬" },
          ].map((item) => {
            const isActive = activeNav === item?.key;
            return (
              <TouchableOpacity
                key={item?.key}
                onPress={() => navigate(item?.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: SPACING.xs * 0.75,
                  paddingVertical: SPACING.xs,
                }}
>
                <View style={{ width: 38, height: 38, borderRadius: RADII.md, backgroundColor: isActive ? COLORS.bg :  "transparent", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>{item?.icon}</Text>
                </View>
                <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: isActive ? "Poppins_600SemiBold" : "Inter_500Medium", color: isActive ? COLORS.primary : COLORS.textMuted }}>{item?.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function CustomerNavigationShell({ renderScreen, navigate, activeNav, onboardingComplete }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      {onboardingComplete && (
        <View
          style={{
            backgroundColor: COLORS.white,
            height: Platform.OS === "ios" ? 84 : 68,
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: Platform.OS === "ios" ? 20 : 4,
          }}
>
          {NAV_ITEMS?.map((item) => {
            const isActive = activeNav === item?.key;
            return (
              <TouchableOpacity
                key={item?.key}
                onPress={() => navigate(item?.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: SPACING.xs * 0.75,
                  paddingVertical: SPACING.xs,
                }}
>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: RADII.md,
                    backgroundColor: isActive ? COLORS.bg :  "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
>
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>{item?.icon}</Text>
                </View>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.caption.fontSize - 1,
                    fontFamily: isActive ? "Poppins_600SemiBold" : "Inter_500Medium",
                    color: isActive ? COLORS.primary : COLORS.textMuted,
                  }}
>
                  {item?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────

function TrustScreen({ onNavigate, showAlert, user }) {
  const [metrics, setMetrics] = useState(null);
  const [workerList, setWorkerList] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider' || user?.role === 'mixed';

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [mRes, lRes] = await Promise.all([
          fetch(`${API_BASE}/admin/trust-metrics`, { headers: { "Authorization": `Bearer ${user?.token}` } }),
          fetch(`${API_BASE}/admin/worker-trust-list`, { headers: { "Authorization": `Bearer ${user?.token}` } })
        ]);
        const mData = await mRes.json();
        const lData = await lRes.json();
        if (mData.success) setMetrics(mData.stats);
        if (lData.success) setWorkerList(lData.data);
      } else if (isProvider) {
        const res = await fetch(`${API_BASE}/v1/providers/personal-trust-metrics`, { headers: { "Authorization": `Bearer ${user?.token}` } });
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data);
        }
      }
    } catch (e) {
      console.error("Fetch Trust Data Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const adminStats = [
    { label: "Verified Workers", value: metrics?.verifiedWorkers || "0", icon: "✅", color: COLORS.success },
    { label: "Pending Review", value: metrics?.pendingReview || "0", icon: "⏳", color: COLORS.warning },
    { label: "Total Reviews", value: metrics?.totalReviews || "0", icon: "⭐", color: COLORS.info },
    { label: "Avg Trust Score", value: metrics?.avgTrustScore ? `${(metrics.avgTrustScore * 20).toFixed(0)}%` : "0%", icon: "🛡️", color: COLORS.info },
  ];

  const providerVerification = [
    { label: "ID Verification", status: metrics?.verificationStatus?.idVerified ? "Verified" : "Pending", icon: "🆔" },
    { label: "License Checks", status: metrics?.verificationStatus?.licenseVerified ? "Verified" : "Pending", icon: "📜" },
    { label: "Background Clearance", status: metrics?.verificationStatus?.backgroundVerified ? "Verified" : "Pending", icon: "🛡️" },
    { label: "Community Vouch", status: metrics?.verificationStatus?.communityVerified ? "Verified" : "Pending", icon: "🤝" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={{
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
            paddingBottom: 24,
          }}
>
          <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold" }}>
            Trust & Verification
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: SPACING.xs, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>
            {isAdmin ? "Admin Dashboard · All Workers" : "Personal Verification Scorecard"}
          </Text>
        </LinearGradient>

        <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
          {isAdmin ? (
            <>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -SPACING.xs * 1.25 }}>
                {adminStats.map((stat, i) => (
                  <View
                    key={i}
                    style={{
                      width: (width - 32) / 2 - 10,
                      margin: SPACING.xs * 1.25,
                      backgroundColor: COLORS.white,
                      borderRadius: RADII.md,
                      paddingVertical: SPACING.md,
                      paddingHorizontal: SPACING.md,
                      elevation: 2,
                      shadowColor: COLORS.black,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                    }}
>
                    <Text style={{ fontSize: TYPOGRAPHY.h2.fontSize, marginBottom: SPACING.xs * 1.5 }}>{stat.icon}</Text>
                    <Text
                      style={{ fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.h2.fontSize, color: stat.color }}
>
                      {stat.value}
                    </Text>
                    <Text style={{ marginTop: SPACING.xs / 2, fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={{ marginTop: 8, marginBottom: SPACING.xs, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.text }}>
                Worker Trust Scores
              </Text>

              {workerList.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => onNavigate('admin', { userId: w.id })}
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: RADII.md,
                    padding: SPACING.md,
                    elevation: 1,
                    shadowColor: COLORS.black,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: SPACING.sm,
                    marginBottom: SPACING.sm
                  }}
>
                  <View style={{ width: 44, height: 44, borderRadius: RADII.md, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.text }}>
                        {w.name}
                      </Text>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.bodySmall.fontSize, color: parseFloat(w.avg_rating) >= 4 ? COLORS.success : COLORS.warning }}>
                        {parseFloat(w.avg_rating).toFixed(1)} ⭐
                      </Text>
                    </View>
                    <Text style={{ marginVertical: 2, fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>
                      Status: {w.status} · {w.review_count} Reviews
                    </Text>
                    <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: RADII.sm / 2 }}>
                      <View
                        style={{
                          width: `${(parseFloat(w.avg_rating) / 5) * 100}%`,
                          height: "100%",
                          borderRadius: RADII.sm / 2,
                          backgroundColor: parseFloat(w.avg_rating) >= 4 ? COLORS.success : COLORS.warning,
                        }}
 />
                    </View>
                  </View>
                  {w.is_verified && <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>✅</Text>}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, elevation: 2, shadowColor: COLORS.black, shadowOpacity: 0.06, shadowRadius: 8 }}>
                 <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", marginBottom: SPACING.sm }}>Verification Checklist</Text>
                 {providerVerification.map((item, idx) => (
                   <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm * 1.25, borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: COLORS.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                        <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>{item.icon}</Text>
                        <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.text, fontFamily: 'Inter_500Medium' }}>{item.label}</Text>
                      </View>
                      <View style={{ backgroundColor: item.status === 'Verified' ? COLORS.bg : COLORS.bg, paddingHorizontal: SPACING.sm * 1.25, paddingVertical: SPACING.xs, borderRadius: RADII.md }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Poppins_600SemiBold', color: item.status === 'Verified' ? COLORS.success : COLORS.accentDark }}>{item.status.toUpperCase()}</Text>
                      </View>
                   </View>
                 ))}
              </View>

              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: 12 }}>
                 <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, alignItems: 'center' }}>
                    <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize, fontFamily: 'Poppins_600SemiBold', color: COLORS.primary }}>{metrics?.metrics?.avgRating || "0.0"}</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs }}>Avg Rating</Text>
                 </View>
                 <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, alignItems: 'center' }}>
                    <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize, fontFamily: 'Poppins_600SemiBold', color: COLORS.primary }}>{metrics?.metrics?.totalReviews || "0"}</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs }}>Total Reviews</Text>
                 </View>
              </View>
            </>
          )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


function BookingsScreen({ onNavigate, user, currentUser, showAlert }) {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/list`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (e) {
      console.error("Fetch bookings failed", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (bookingId, action) => {
    setLoading(true);
    try {
      const endpoint = `${API_BASE}/bookings/${bookingId}/${action}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        showAlert(data.message || "Action successful");
        fetchBookings();
      } else {
        showAlert(data.error || "Action failed");
      }
    } catch (e) {
      showAlert("Error performing action: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBookings} />} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
        <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, paddingBottom: 24 }}>
          <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold" }}>My Bookings</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: SPACING.xs, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>Work History & Financial Milestones</Text>
        </LinearGradient>

        <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
          {(!bookings || bookings?.length === 0) ? (
            <View style={{ padding: SPACING.xl * 1.25, alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADII.md }}>
              <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, textAlign: 'center' }}>No bookings found.</Text>
            </View>
          ) : bookings?.map((b, idx) => {
            const isCustomer = currentUser === 'customer';
            const isProvider = currentUser === 'provider';

            return (
              <View key={b?.id || idx} style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.body.fontSize, color: COLORS.text }}>{b?.service_type}</Text>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.primary }}>K{b?.price}</Text>
                </View>
                <View style={{ marginBottom: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>{isCustomer ? `Provider: ${b?.provider_name || 'Unassigned'}` : `Customer: ${b?.customer_name}`}</Text>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs / 2 }}>Status: {(b?.status || "").toUpperCase()}</Text>
                </View>

                {/* Actions based on State Machine */}
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  {b?.status === 'pending' && isProvider && (
                    <ThemedButton onPress={() => handleAction(b?.id, 'accept')} title="Accept Job" style={{ flex: 1 }} />
                  )}
                  {b?.status === 'accepted' && isCustomer && (
                    <ThemedButton onPress={() => handleAction(b?.id, 'escrow')} title="Confirm & Pay (Escrow)" variant="slate" style={{ flex: 1 }} />
                  )}
                  {b?.status === 'in_progress' && isProvider && (
                    <ThemedButton onPress={() => handleAction(b?.id, 'complete')} title="Mark as Completed" style={{ flex: 1, backgroundColor: COLORS.accent }} />
                  )}
                  {b?.status === 'completed_awaiting_approval' && isCustomer && (
                    <ThemedButton onPress={() => handleAction(b?.id, 'approve')} title="Approve & Release Funds" style={{ flex: 1, backgroundColor: COLORS.success }} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
        </View>

      </ScrollView>
    </View>
  );
}

function RoleSelectionScreen({ onSelectRole, showAlert }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontFamily: "Poppins_700Bold", color: COLORS.primary, textAlign: "center", marginBottom: SPACING.sm }}>
        Choose Your Role
      </Text>
      <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, color: COLORS.textMuted, textAlign: "center", marginBottom: SPACING.xs0, paddingHorizontal: SPACING.md }}>
        How would you like to use the Wantok Workforce platform today?
      </Text>

      <View style={{ flexDirection: "row", gap: SPACING.sm }}>
        <TouchableOpacity
          onPress={() => onSelectRole("customer")}
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            borderRadius: RADII.lg,
            padding: SPACING.md,
            alignItems: "center",
            borderWidth: 2,
            borderColor: COLORS.border,
            elevation: 4,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}
>
          <View style={{ width: 70, height: 70, borderRadius: RADII.sm / 25, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md }}>
            <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize + 8 }}>🤝</Text>
          </View>
          <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, textAlign: "center", marginBottom: SPACING.sm }}>
            Become a Customer
          </Text>
          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, textAlign: "center", lineHeight: 16 }}>
            I want to find and hire trusted local professionals in Port Moresby.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectRole("provider")}
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            borderRadius: RADII.lg,
            padding: SPACING.md,
            alignItems: "center",
            borderWidth: 2,
            borderColor: COLORS.border,
            elevation: 4,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}
>
          <View style={{ width: 70, height: 70, borderRadius: RADII.sm / 25, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md }}>
            <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize + 8 }}>🔧</Text>
          </View>
          <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, textAlign: "center", marginBottom: SPACING.sm }}>
            Become a Service Provider
          </Text>
          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, textAlign: "center", lineHeight: 16 }}>
            I want to list my trade, grow my business, and find local jobs.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProviderOnboardingScreen({ onComplete, user, showAlert }) {
  const [formData, setFormData] = useState({
    business_name: "",
    service_category: "",
    bio: "",
    hourly_rate: "",
    operating_suburb: ""
  });
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!formData.business_name || !formData.service_category || !formData.operating_suburb || !formData.hourly_rate) {
      showAlert("Please fill in all required storefront fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/providers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));
      if (response.ok) {
        onComplete(formData);
      } else {
        showAlert(data.error || "Failed to setup storefront.");
      }
    } catch (error) {
      console.error("Storefront setup error:", error);
      showAlert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: COLORS.white,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADII.md,
          padding: SPACING.md,
          fontSize: TYPOGRAPHY.body.fontSize,
          minHeight: multiline ? 80 : 50,
          textAlignVertical: multiline ? 'top' : 'center'
        }}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
 />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: SPACING.lg }}>
      <Text style={{ fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.xs0 }}>
        Setup Your Storefront
      </Text>
      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginBottom: 32 }}>
        Configure your basic storefront details to start accepting jobs immediately.
      </Text>

      <InputField label="Business Name" value={formData.business_name} onChange={v => setFormData({...formData, business_name: v})} placeholder="Trading name (e.g. John's Electric)" />

      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>Service Category</Text>
      <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, marginBottom: SPACING.md, paddingHorizontal: SPACING.sm * 1.5, borderWidth: 1, borderColor: COLORS.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: SPACING.sm * 1.25 }}>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              onPress={() => setFormData({...formData, service_category: cat.label})}
              style={{
                paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs * 1.5, borderRadius: RADII.lg, marginRight: 8,
                backgroundColor: formData.service_category === cat.label ? COLORS.primary : COLORS.bg,
                borderWidth: 1, borderColor: COLORS.border
              }}
>
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_500Medium', color: formData.service_category === cat.label ? COLORS.white : COLORS.text }}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <InputField label="Professional Bio" value={formData.bio} onChange={v => setFormData({...formData, bio: v})} placeholder="Briefly describe your skills..." multiline />

      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <InputField label="Hourly Rate (PGK)" value={formData.hourly_rate} onChange={v => setFormData({...formData, hourly_rate: v})} placeholder="50.00" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <InputField label="Operating Suburb" value={formData.operating_suburb} onChange={v => setFormData({...formData, operating_suburb: v})} placeholder="e.g. Waigani" />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleComplete}
        disabled={loading}
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: RADII.md,
          paddingVertical: SPACING.md,
          alignItems: "center",
          marginTop: SPACING.md,
          marginBottom: SPACING.xs0,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
>
        <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold" }}>
          {loading ? "SAVING..." : "ACTIVATE MY STOREFRONT"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProviderProfileForm({ user, showAlert }) {
  const [profile, setProfile] = useState({
    business_name: '', service_category: '', bio: '', hourly_rate: '',
    primary_phone: '', whatsapp_business: '', operating_suburb: '',
    bank_name: '', bank_account_name: '', bank_account_number: '',
    is_accepting_jobs: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/providers/profile`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile({
          ...data.data,
          hourly_rate: String(data.data.hourly_rate || '')
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/v1/providers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Provider storefront profile securely updated.");
      } else {
        showAlert(data.error || "Failed to update profile");
      }
    } catch (e) {
      showAlert("Network error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, keyboardType = 'default', multiline = false, note = "" }) => (
    <View style={{ marginBottom: SPACING.md, flex: 1 }}>
      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium", color: COLORS.textMuted, marginBottom: SPACING.sm }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          backgroundColor: COLORS.white, borderRadius: RADII.sm, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
          minHeight: multiline ? 80 : 45, textAlignVertical: multiline ? 'top' : 'center'
        }}
 />
      {note ? <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight, marginTop: SPACING.xs }}>{note}</Text> : null}
    </View>
  );

  return (
    <View style={{ padding: SPACING.md }}>
      <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, marginBottom: SPACING.md }}>Storefront Configuration</Text>

      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md }}>
        <InputField label="Business Name" value={profile.business_name} onChange={t => setProfile({...profile, business_name: t})} placeholder="Trading name" />
        <InputField label="Service Category" value={profile.service_category} onChange={t => setProfile({...profile, service_category: t})} placeholder="e.g. Electrical, Plumbing" />
      </View>

      <InputField label="Professional Bio" value={profile.bio} onChange={t => setProfile({...profile, bio: t})} placeholder="Skills & qualification overview" multiline />

      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md, marginBottom: SPACING.md }}>
        <InputField label="Hourly Rate (PGK)" value={profile.hourly_rate} onChange={t => setProfile({...profile, hourly_rate: t})} placeholder="0.00" keyboardType="numeric" />
        <InputField label="Operating Suburb" value={profile.operating_suburb} onChange={t => setProfile({...profile, operating_suburb: t})} placeholder="e.g. Waigani, Boroko" />
      </View>

      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md, marginBottom: SPACING.md }}>
        <InputField label="Primary Phone" value={profile.primary_phone} onChange={t => setProfile({...profile, primary_phone: t})} placeholder="Voice line" />
        <InputField label="WhatsApp Business" value={profile.whatsapp_business} onChange={t => setProfile({...profile, whatsapp_business: t})} placeholder="Channel for media" note="Media/Coordinate sharing channel" />
      </View>

      <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, marginTop: 10, marginBottom: SPACING.md }}>Financial / Payout Details</Text>

      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md, marginBottom: SPACING.md }}>
        <InputField label="Bank Name" value={profile.bank_name} onChange={t => setProfile({...profile, bank_name: t})} placeholder="e.g. BSP, Kina Bank" />
        <InputField label="Account Name" value={profile.bank_account_name} onChange={t => setProfile({...profile, bank_account_name: t})} placeholder="Name on statement" />
      </View>
      <InputField label="Account Number" value={profile.bank_account_number} onChange={t => setProfile({...profile, bank_account_number: t})} placeholder="EFT transfer number" />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.bg, borderRadius: RADII.md }}>
        <View>
          <Text style={{ fontFamily: "Inter_600SemiBold", color: COLORS.text }}>Accepting New Jobs</Text>
          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>Toggle visibility in search results</Text>
        </View>
        <Switch value={profile.is_accepting_jobs} onValueChange={v => setProfile({...profile, is_accepting_jobs: v})} />
      </View>

      <View style={{ alignItems: isDesktop ? "flex-end" : "stretch", marginBottom: SPACING.md }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center", width: isDesktop ? 200 : "100%" }}
>
          <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.body.fontSize }}>{saving ? "Saving..." : "Save Profile"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AuthScreen({ onAuth, showAlert }) {
  const [loading, setLoading] = useState(false);

  const handleOAuth = async (provider) => {
    const role = mode === 'signup' ? (signUpStep === 1 ? 'customer' : 'customer') : 'customer';
    // In a more complex flow, we'd know if they are signing up as a provider.
    // Given the current UI, if they are in 'signup' mode, we might want to capture intent.
    // However, the directive said OAuth serves both.

    // Let's refine the role detection based on a hypothetical 'isProvider' state if we had one.
    // Since we don't, and the existing signup doesn't ask for role until after registration,
    // we'll use 'customer' as default and let them select later if needed,
    // OR we can check if they are in a specific view.

    if (Platform.OS === 'web') {
      const authUrl = `${API_BASE}/auth/${provider}?role=${role}&platform=web`;
      window.location.href = authUrl;
    } else {
      try {
        const redirectUri = LinkingExpo.createURL('auth-callback');
        const authUrl = `${API_BASE}/auth/${provider}?role=${role}&platform=native&redirect_uri=${encodeURIComponent(redirectUri)}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

        if (result.type === 'success' && result.url) {
          const { queryParams } = LinkingExpo.parse(result.url);
          if (queryParams && queryParams.token) {
            // Mocking the fetch of user profile after token is received
            // In a real app, you might want a specific endpoint to get user from token
            onAuth({ token: queryParams.token }, false);
          }
        }
      } catch (error) {
        showAlert("OAuth Error: " + error.message);
      }
    }
  };

  const [dbStatus, setDbStatus] = useState("checking");

  useEffect(() => {
    const checkDB = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      try {
        // First check basic API health
        console.log(`🔍 Checking system health at: ${API_BASE}/health`);
        const apiRes = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        console.log(`📡 API Health Response: ${apiRes.status}`);
        if (apiRes.ok) {
          // If API is healthy, check DB health
          const dbRes = await fetch(`${API_BASE}/health/db`, { signal: controller.signal });
          if (dbRes.ok) setDbStatus("connected");
          else setDbStatus("online (db issues)");
        } else {
          setDbStatus("error");
        }
      } catch (e) {
        console.error("❌ Health check failed:", e);
        setDbStatus("offline");
      } finally {
        clearTimeout(timeoutId);
      }
    };
    checkDB();
  }, []);
  const [mode, setMode] = useState("signin");
  const [signUpStep, setSignUpStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState(""); // Unified local state for Sign In to fix lag
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      showAlert("Please enter both identifier (Phone/Email) and password.");
      return;
    }
    if (loading) return;
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let data;
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        signal: controller.signal
      });

      data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

      if (response.ok) {
        onAuth({ ...data.user, token: data.token, active_persona: (data.user.roles && data.user.roles.includes('admin')) ? 'admin' : data.user.role }, false);
      } else {
        showAlert("Network Status: " + response.status + "\nDetails: " + (data.details || data.error || "Signin failed"));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showAlert('Server connection timeout. Please check backend logs.');
      } else {
        console.error("🚨 Full Network Error (SignIn):", error);
        showAlert("Network Status: OFFLINE\nDetails: " + (data?.message || data?.error || error.message || "Please verify your credentials or check connection."));
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSignUpNext = async () => {
    if (signUpStep === 1) {
      if (!name || !email) {
        showAlert("Please provide your full name and email address.");
        return;
      }
      setSignUpStep(2);
    } else {
      if (!phone || !password) {
        showAlert("Please provide your phone number and create a password.");
        return;
      }
      if (password.length < 6) {
        showAlert("Password must be at least 6 characters long.");
        return;
      }
      if (loading) return;
      setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let data;
      try {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password }),
          signal: controller.signal
        });

        data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

        if (response.ok) {
          console.log('✅ Registration success payload:', data);
          onAuth({ ...data.user, token: data.token, active_persona: data.user.role }, true);
        } else {
          showAlert("Network Status: " + response.status + "\nDetails: " + (data.details || data.error || "Signup failed"));
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          showAlert('Server connection timeout. Please check backend logs.');
        } else {
          console.error("🚨 Full Network Error (SignUp):", error);
          showAlert("Network Status: OFFLINE\nDetails: " + (data?.message || data?.error || error.message || "Please verify your credentials or check connection."));
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ height: 200, justifyContent: "center", alignItems: "center" }}
      >
        <Image
          source={require("./assets/brand_logo.jpg")}
          style={{ width: 80, height: 80, borderRadius: RADII.sm / 20, marginBottom: SPACING.sm }}
        />
        <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_700Bold" }}>
          WANTOK WORKFORCE
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs, borderRadius: RADII.lg }}>
          <View style={{ width: 8, height: 8, borderRadius: RADII.sm / 2, backgroundColor: dbStatus === "connected" ? COLORS.success : (dbStatus === "checking" ? COLORS.warning : COLORS.danger), marginRight: 6 }} />
          <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" }}>
            System Status: {dbStatus}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.lg, elevation: 4, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, maxWidth: 450, width: "100%", alignSelf: "center" }}>
          <Heading level={2} style={{ marginBottom: SPACING.xs }}>
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </Heading>
          <Body style={{ color: COLORS.textMuted, marginBottom: SPACING.lg }}>
            {mode === "signin"
              ? "Sign in to continue your journey"
              : `Step ${signUpStep} of 2: ${signUpStep === 1 ? "Basic Info" : "Security"}`}
          </Body>

          {mode === "signin" ? (
            <>
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>
                  Phone Number or Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: RADII.sm,
                    padding: SPACING.sm,
                    fontSize: TYPOGRAPHY.bodySmall.fontSize,
                  }}
                  placeholder="email@example.com"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ marginBottom: SPACING.lg }}>
                <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: RADII.sm,
                      padding: SPACING.sm,
                      paddingRight: 50,
                      fontSize: TYPOGRAPHY.bodySmall.fontSize,
                    }}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: 12 }}
                  >
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.primary }}>
                      {showPassword ? "HIDE" : "SHOW"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSignIn}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: SPACING.md,
                  borderRadius: RADII.md,
                  alignItems: "center",
                  marginBottom: SPACING.md,
                }}
              >
                <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.body.fontSize }}>{loading ? "Signing In..." : "Sign In"}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                <Text style={{ marginHorizontal: 10, color: COLORS.textLight, fontSize: TYPOGRAPHY.caption.fontSize }}>OR CONTINUE WITH</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              </View>

              <View style={{ gap: SPACING.sm, marginBottom: SPACING.md }}>
                <TouchableOpacity onPress={() => handleOAuth('google')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.md, paddingVertical: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold' }}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOAuth('microsoft')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.md, paddingVertical: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold' }}>Outlook</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOAuth('oidc')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.md, paddingVertical: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold' }}>Another Account</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {signUpStep === 1 ? (
                <>
                  <View style={{ marginBottom: SPACING.md }}>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>
                      Full Name
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: RADII.sm,
                        padding: SPACING.sm,
                        fontSize: TYPOGRAPHY.bodySmall.fontSize,
                      }}
                      placeholder="e.g. John Smith"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View style={{ marginBottom: SPACING.lg }}>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>
                      Email Address
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: RADII.sm,
                        padding: SPACING.sm,
                        fontSize: TYPOGRAPHY.bodySmall.fontSize,
                      }}
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={{ marginBottom: SPACING.md }}>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>
                      Phone Number
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: RADII.sm,
                        padding: SPACING.sm,
                        fontSize: TYPOGRAPHY.bodySmall.fontSize,
                      }}
                      placeholder="e.g. 7000 1234"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={{ marginBottom: SPACING.lg }}>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textLight, marginBottom: SPACING.xs * 1.5 }}>
                      Create Password
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        style={{
                          backgroundColor: COLORS.white,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          borderRadius: RADII.sm,
                          padding: SPACING.sm,
                          paddingRight: 50,
                          fontSize: TYPOGRAPHY.bodySmall.fontSize,
                        }}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 12, top: 12 }}
                      >
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.primary }}>
                          {showPassword ? "HIDE" : "SHOW"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
              <TouchableOpacity
                onPress={handleSignUpNext}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: SPACING.md,
                  borderRadius: RADII.md,
                  alignItems: "center",
                  marginBottom: SPACING.md,
                }}
              >
                <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.body.fontSize }}>
                  {loading ? "Creating Account..." : (signUpStep === 1 ? "Next Step" : "Create Account")}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                <Text style={{ marginHorizontal: 10, color: COLORS.textLight, fontSize: TYPOGRAPHY.caption.fontSize }}>OR CONTINUE WITH</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              </View>

              <View style={{ gap: SPACING.sm, marginBottom: SPACING.md }}>
                <TouchableOpacity onPress={() => handleOAuth('google')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.md, paddingVertical: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold' }}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOAuth('microsoft')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.md, paddingVertical: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold' }}>Outlook</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOAuth('oidc')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.md, paddingVertical: SPACING.sm }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: 'Inter_600SemiBold' }}>Another Account</Text>
                </TouchableOpacity>
              </View>
              {signUpStep === 2 && (
                <TouchableOpacity onPress={() => setSignUpStep(1)} style={{ alignItems: "center", marginBottom: SPACING.md }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>Back to Basic Info</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ flexDirection: "row", justifyContent: "center", gap: SPACING.xs * 1.5 }}>
            <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setSignUpStep(1);
            }}>
              <Text style={{ color: COLORS.primary, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.bodySmall.fontSize }}>
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function AdminAuthScreen({ onAuth, showAlert }) {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async () => {
    if (!identifier || !password) {
      showAlert("Please enter admin credentials.");
      return;
    }
    setLoading(true);

    let data;
    try {
      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

      if (response.ok) {
        // Strict Role Check: Must be admin
        if (data.user.roles && data.user.roles.includes('admin')) {
          onAuth({ ...data.user, token: data.token, active_persona: 'admin' }, false);
        } else {
          showAlert("Access Denied: Administrative privileges required.");
          if (Platform.OS === 'web') window.location.href = '/';
        }
      } else {
        showAlert("Network Status: " + response.status + "\nDetails: " + (data.error || "Login failed"));
      }
    } catch (error) {
      console.error("🚨 Full Network Error (AdminLogin):", error);
      showAlert("Network Status: OFFLINE\nDetails: " + (data?.message || data?.error || error.message || "Unknown network error."));
    } finally {
      setLoading(false);
    }
  };

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.slate, justifyContent: "center", padding: SPACING.lg }}>
        <View style={{ maxWidth: 450, width: "100%", alignSelf: "center" }}>
          <View style={{ alignItems: "center", marginBottom: SPACING.xs0 }}>
            <View style={{ width: 64, height: 64, borderRadius: RADII.sm / 22, backgroundColor: COLORS.slateLight, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md }}>
              <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize + 4 }}>🔐</Text>
            </View>
            <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_700Bold", letterSpacing: 1 }}>
              ADMIN PORTAL
            </Text>
            <Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.bodySmall.fontSize, marginTop: 8 }}>
              Wantok Workforce Back-Office
            </Text>
          </View>

          <View style={{ backgroundColor: COLORS.slate, borderRadius: RADII.md, padding: SPACING.lg, elevation: 8 }}>
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", marginBottom: SPACING.sm, textTransform: "uppercase" }}>
                Admin Identifier
              </Text>
              <TextInput
                style={{ backgroundColor: COLORS.slate, color: COLORS.white, borderRadius: RADII.sm, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.slateLight }}
                placeholder="Username or Email"
                placeholderTextColor={COLORS.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", marginBottom: SPACING.sm, textTransform: "uppercase" }}>
                Security Key
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={{ backgroundColor: COLORS.slate, color: COLORS.white, borderRadius: RADII.sm, padding: SPACING.sm, paddingRight: 48, borderWidth: 1, borderColor: COLORS.slateLight }}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: 12 }}
                >
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>{showPassword ? "👁️" : "🔒"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAdminLogin}
              disabled={loading}
              style={{
                backgroundColor: COLORS.info,
                padding: SPACING.md,
                borderRadius: RADII.sm,
                alignItems: "center",
                opacity: loading ? 0.7 : 1
              }}
            >
              <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.body.fontSize }}>
                {loading ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => { if (Platform.OS === "web") window.location.href = "/"; }}
            style={{ marginTop: SPACING.lg, alignItems: "center" }}
          >
            <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>Return to Public Site</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}
function WorkerDetailScreen({ worker, onNavigate, showAlert, user }) {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!user || !worker) return;
    try {
      const res = await fetch(`${API_BASE}/messages?providerId=${worker.id}&userId=${user.id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error("Chat history fetch failed:", e);
    }
  };

  useEffect(() => {
    let interval;
    if (isChatVisible) {
      fetchHistory();
      interval = setInterval(fetchHistory, 3000);
    }
    return () => clearInterval(interval);
  }, [isChatVisible]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!user || !worker) return;

    try {
      // For each file, we'd normally upload to S3/Cloudinary first.
      // Since this is a specialized task, we will simulate the file upload and send metadata.
      // In a real production app, we would use FormData if the backend supports direct multipart.

      const sendPayload = async (fileData = null) => {
        const body = {
          receiverId: worker.id,
          providerId: worker.id,
          text: newMessage.trim()
        };
        if (fileData) {
          body.fileUrl = fileData.url;
          body.fileName = fileData.name;
          body.fileType = fileData.type;
        }

        const res = await fetch(`${API_BASE}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify(body)
        });
        return res.ok;
      };

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Simulation: convert file to a local object URL for preview/demo
          // In reality, this would be the URL from the file storage service
          const simulatedUrl = Platform.OS === 'web' ? URL.createObjectURL(file) : 'https://via.placeholder.com/150';
          await sendPayload({ url: simulatedUrl, name: file.name, type: file.type });
        }
      } else {
        await sendPayload();
      }

      setNewMessage("");
      setSelectedFiles([]);
      fetchHistory();
    } catch (e) {
      showAlert("Failed to send message");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      <ScrollView>
        <View style={{ padding: SPACING.md, alignItems: "center" }}>
          <LinearGradient
            colors={[COLORS.info, COLORS.primaryDark]}
            style={{ width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md }}
          >
            <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h1.fontSize + 12, fontFamily: "Poppins_600SemiBold" }}>{worker?.name?.charAt(0) || "W"}</Text>
          </LinearGradient>
          <Text style={{ fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text }}>{worker?.name}</Text>
          <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, color: COLORS.primary, fontFamily: "Inter_500Medium", marginTop: SPACING.xs }}>{worker?.primary_skill}</Text>
        </View>
        <View style={{ padding: SPACING.md }}>
          <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Inter_600SemiBold", marginBottom: SPACING.sm, color: COLORS.text }}>About</Text>
          <Text style={{ color: COLORS.textMuted, lineHeight: 20 }}>{worker?.bio || "No professional bio provided yet."}</Text>
          <TouchableOpacity
            onPress={() => onNavigate("createBooking", worker)}
            style={{ backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center", marginTop: SPACING.lg + SPACING.sm }}
          >
            <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold" }}>Book Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsChatVisible(true)}
            style={{ borderHorizontal: 0, borderWidth: 1, borderColor: COLORS.primaryDark, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center", marginTop: 12 }}
          >
            <Text style={{ color: COLORS.primaryDark, fontFamily: "Poppins_600SemiBold" }}>Chat Now</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onNavigate("home")} style={{ marginTop: SPACING.md, alignItems: "center" }}>
            <Text style={{ color: COLORS.textMuted }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={isChatVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Poppins_600SemiBold', color: COLORS.text }}>Chat with {worker?.name}</Text>
              <TouchableOpacity onPress={() => setIsChatVisible(false)}>
                <Text style={{ color: COLORS.primary, fontFamily: 'Inter_600SemiBold' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: SPACING.md }}>
              {(messages || []).map((msg, idx) => {
                const isMine = msg.sender_id === user?.id;
                return (

                  <View key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? COLORS.primaryDark : COLORS.bg, padding: SPACING.sm, borderRadius: RADII.md, marginBottom: SPACING.sm, maxWidth: '80%' }}>
                    {msg.file_url && (
                      <View style={{ marginBottom: SPACING.sm }}>
                        {msg.file_type && msg.file_type.startsWith('image/') ? (
                          <TouchableOpacity onPress={() => showAlert("Image preview modal here")}>
                            <Image source={{ uri: msg.file_url }} style={{ width: 200, height: 150, borderRadius: RADII.sm, resizeMode: 'cover' }} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity onPress={() => { if (Platform.OS === 'web') window.open(msg.file_url, '_blank'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(0,0,0,0.05)', padding: SPACING.sm, borderRadius: RADII.sm }}>
                            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>📄</Text>
                            <View style={{ flex: 1 }}>
                              <Text numberOfLines={1} style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: isMine ? COLORS.white : COLORS.text }}>{msg.file_name}</Text>
                              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }}>{msg.file_type || 'Document'}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    <Text style={{ color: isMine ? COLORS.white : COLORS.text, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{msg.text}</Text>
                  </View>
                );
              })}
            </ScrollView>


              {selectedFiles.length > 0 && (
                <View style={{ padding: SPACING.sm, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                    {selectedFiles.map((file, fIdx) => (
                      <View key={fIdx} style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs * 1.5 }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_500Medium', maxWidth: 120 }} numberOfLines={1}>{file.name}</Text>
                        <TouchableOpacity onPress={() => removeFile(fIdx)} style={{ backgroundColor: COLORS.border, width: 18, height: 18, borderRadius: RADII.sm/2, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: 'Poppins_700Bold', color: COLORS.white }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
<View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style={{ display: 'none' }} />
              <TouchableOpacity onPress={() => fileInputRef.current?.click()} style={{ width: 44, height: 44, borderRadius: RADII.pill, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>📎</Text>
              </TouchableOpacity>

              <TextInput
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: RADII.sm, padding: SPACING.sm }}
              />
              <TouchableOpacity onPress={handleSendMessage} style={{ backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADII.sm }}>
                <Text style={{ color: COLORS.white, fontFamily: 'Inter_600SemiBold' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



    </View>
  );
}

function CreateBookingScreen({ worker, onNavigate, user, showAlert }) {
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          service_type: worker?.primary_skill || "General Service",
          price: worker?.hourly_rate || 50.00,
          scheduled_at: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Booking Request Sent!");
        onNavigate("booking");
      } else {
        showAlert(data.error || "Failed to create booking");
      }
    } catch (e) {
      showAlert("Error creating booking: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md, justifyContent: "center" }}>
      <Text style={{ fontSize: TYPOGRAPHY.h2.fontSize, fontFamily: "Poppins_600SemiBold", textAlign: "center", marginBottom: SPACING.sm, color: COLORS.text }}>Book {worker?.name}</Text>
      <Text style={{ textAlign: "center", color: COLORS.textMuted, marginBottom: SPACING.sm }}>Service: {worker?.primary_skill}</Text>
      <Text style={{ textAlign: "center", color: COLORS.primary, fontFamily: 'Inter_600SemiBold', fontSize: TYPOGRAPHY.h3.fontSize, marginBottom: SPACING.lg + SPACING.sm }}>K{worker?.hourly_rate}/hr</Text>

      <TouchableOpacity
        onPress={handleBooking}
        disabled={loading}
        style={{ backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center", opacity: loading ? 0.6 : 1 }}
      >
        <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold" }}>{loading ? "Sending..." : "Confirm Booking"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate("home")} style={{ marginTop: SPACING.md, alignItems: "center" }}>
        <Text style={{ color: COLORS.textMuted }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileScreen({ onNavigate, currentUser, onLogout, user, onUpdateUser, showAlert }) {
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsapp_number || "");
  const [physicalAddress, setPhysicalAddress] = useState(user?.physical_address || "");
  const [savedLocations, setSavedLocations] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ label: '', address: '', longitude: 0, latitude: 0, is_default: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser === "customer") {
      fetchSavedLocations();
    }
  }, [currentUser]);

  const fetchSavedLocations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile/locations`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) setSavedLocations(data.data);
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    if (!phoneNumber || !physicalAddress) {
      showAlert("Phone Number and Physical Address are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          whatsapp_number: whatsappNumber,
          physical_address: physicalAddress,
          saved_locations: savedLocations.filter(l => l.isNew)
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Profile updated successfully!");
        if (onUpdateUser) onUpdateUser({ ...user, ...data.data });
      } else {
        showAlert(data.error || "Failed to update profile");
      }
    } catch (e) {
      showAlert("Network error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.label || !newLocation.address) {
      showAlert("Please enter a label and address");
      return;
    }
    setSavedLocations([...savedLocations, { ...newLocation, isNew: true }]);
    setShowLocationModal(false);
    setNewLocation({ label: '', address: '', longitude: 0, latitude: 0, is_default: false });
    showAlert("Location added to list. Click Save Changes to persist.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}>
        <View style={{ maxWidth: 800, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
          <View style={{ padding: SPACING.lg, alignItems: "center", backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
             <View style={{ width: 80, height: 80, borderRadius: RADII.sm / 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: SPACING.sm }}>
               <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.h1.fontSize + 4, fontFamily: "Poppins_600SemiBold" }}>{user?.name?.charAt(0) || "U"}</Text>
             </View>
             <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text }}>{user?.name}</Text>
             <Text style={{ color: COLORS.textMuted }}>{user?.email}</Text>
             <View style={{ backgroundColor: COLORS.primary + "15", paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs, borderRadius: RADII.lg, marginTop: 8 }}>
               <Text style={{ color: COLORS.primary, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>{currentUser?.toUpperCase()}</Text>
             </View>
          </View>

          {currentUser === "provider" && (
            <ProviderProfileForm user={user} showAlert={showAlert} />
          )}

          {currentUser === "customer" && (
            <View style={{ padding: SPACING.md }}>
              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text, marginBottom: SPACING.md }}>Contact Information</Text>

              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md, marginBottom: SPACING.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium", color: COLORS.textMuted, marginBottom: SPACING.sm }}>Phone Number</Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter phone number"
                    style={{ backgroundColor: COLORS.white, borderRadius: RADII.sm, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border }}
 />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium", color: COLORS.textMuted, marginBottom: SPACING.sm }}>WhatsApp Number</Text>
                  <TextInput
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                    placeholder="Enter WhatsApp number"
                    style={{ backgroundColor: COLORS.white, borderRadius: RADII.sm, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border }}
 />
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight, marginTop: SPACING.xs }}>For order/delivery status alerts via WhatsApp</Text>
                </View>
              </View>

              <View style={{ marginBottom: SPACING.lg }}>
                <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_500Medium", color: COLORS.textMuted, marginBottom: SPACING.sm }}>Primary Physical Address</Text>
                <TextInput
                  value={physicalAddress}
                  onChangeText={setPhysicalAddress}
                  placeholder="Enter your full address"
                  multiline
                  numberOfLines={3}
                  style={{ backgroundColor: COLORS.white, borderRadius: RADII.sm, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, minHeight: 80, textAlignVertical: 'top' }}
 />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.text }}>Saved Addresses</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(true)}>
                  <Text style={{ color: COLORS.primary, fontFamily: "Inter_600SemiBold" }}>+ Add New</Text>
                </TouchableOpacity>
              </View>

              {savedLocations.length === 0 ? (
                <View style={{ padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADII.md, alignItems: "center", marginBottom: SPACING.lg }}>
                  <Text style={{ color: COLORS.textLight }}>No saved addresses yet.</Text>
                </View>
              ) : (
                <View style={{ marginBottom: SPACING.lg }}>
                  {savedLocations.map(loc => (
                    <View key={loc.id} style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: loc.is_default ? COLORS.primary : COLORS.border }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", color: COLORS.text }}>{loc.location_label} {loc.is_default && "✅"}</Text>
                        <TouchableOpacity onPress={() => { /* Delete logic */ }}>
                          <Text style={{ color: COLORS.danger, fontSize: TYPOGRAPHY.caption.fontSize }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize, marginTop: SPACING.xs }}>{loc.address_line}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ alignItems: isDesktop ? "flex-end" : "stretch", marginBottom: SPACING.md }}>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={saving}
                  style={{ backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center", width: isDesktop ? 200 : "100%" }}
>
                  <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.body.fontSize }}>{saving ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ padding: SPACING.md, paddingTop: 0 }}>
            <TouchableOpacity onPress={onLogout} style={{ flexDirection: "row", alignItems: "center", padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADII.md, marginBottom: SPACING.sm }}>
              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, marginRight: 12 }}>🚪</Text>
              <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_500Medium", color: COLORS.danger }}>Logout</Text>
            </TouchableOpacity>
            {user?.roles?.includes("admin") && (
              <TouchableOpacity onPress={() => onNavigate("admin")} style={{ flexDirection: "row", alignItems: "center", padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADII.md }}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, marginRight: 12 }}>🛠️</Text>
                <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_500Medium", color: COLORS.text }}>Admin Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Inline Location Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: SPACING.md }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.lg }}>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", marginBottom: SPACING.md }}>Add New Location</Text>

            <TextInput
              placeholder="Location Tag (e.g. Home, Office)"
              value={newLocation.label}
              onChangeText={t => setNewLocation({...newLocation, label: t})}
              style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.sm }}
 />
            <TextInput
              placeholder="Full Address Line"
              value={newLocation.address}
              onChangeText={t => setNewLocation({...newLocation, address: t})}
              style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.sm }}
 />
            <View style={{ flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <TextInput
                placeholder="Latitude"
                value={String(newLocation.latitude)}
                onChangeText={t => setNewLocation({...newLocation, latitude: parseFloat(t) || 0})}
                keyboardType="numeric"
                style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm }}
 />
              <TextInput
                placeholder="Longitude"
                value={String(newLocation.longitude)}
                onChangeText={t => setNewLocation({...newLocation, longitude: parseFloat(t) || 0})}
                keyboardType="numeric"
                style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm }}
 />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }}>
              <Text>Set as default delivery address</Text>
              <Switch
                value={newLocation.is_default}
                onValueChange={v => setNewLocation({...newLocation, is_default: v})}
 />
            </View>

            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={{ flex: 1, padding: SPACING.md, backgroundColor: COLORS.bg, borderRadius: RADII.md, alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddLocation} style={{ flex: 1, padding: SPACING.md, backgroundColor: COLORS.primary, borderRadius: RADII.md, alignItems: "center" }}>
                <Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold" }}>Save Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AdminScreen({ onNavigate, onLogout, user, showAlert, screenData }) {
  const { width: screenWidth } = Dimensions.get("window");
  const [stats, setStats] = useState({ totalCustomers: 0, totalProviders: 0, totalMatches: 0 });
  const [pendingProviders, setPendingProviders] = useState([]);
  const [pendingVouching, setPendingVouching] = useState([]);
  const [ledgerStats, setLedgerStats] = useState({ totalEscrowCapital: 0, totalDisbursements: 0, totalRevenue: 0 });
  const [disputedJobs, setDisputedJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("verification_queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  useEffect(() => {
    if (screenData?.userId) {
      setEditingUser({ id: screenData.userId });
      setModalVisible(true);
    }
  }, [screenData]);

  const [logs, setLogs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [systemSettings, setSystemSettings] = useState({ match_radius: 50, platform_fee: 10, maintenance_mode: false });

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isMatchDetailModalVisible, setIsMatchDetailModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchMatchDetails = async (matchId) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_BASE}/admin/queue/${matchId}`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMatch(data.data);
        setIsMatchDetailModalVisible(true);
      } else {
        showAlert(data.error || "Failed to load match details");
      }
    } catch (e) {
      showAlert("Network error loading match details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReassign = async (matchId, providerId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/queue/${matchId}/reassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Match reassigned successfully");
        fetchMatchDetails(matchId);
        fetchQueue();
      } else {
        showAlert(data.error || "Failed to reassign match");
      }
    } catch (e) {
      showAlert("Network error during reassignment");
    }
  };

  useEffect(() => {
    if (user && user?.roles && user.roles.includes("admin") && user?.active_persona !== "admin") {
      console.log("🛠️ Admin Screen: Normalizing active_persona to admin");
      if (user) user.active_persona = "admin";
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard-metrics`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.data) {
        setStats({
          totalCustomers: data.data.totalCustomers ?? 0,
          totalProviders: data.data.totalProviders ?? 0,
          totalMatches: data.data.totalMatches ?? 0
        });
      }
    } catch (e) {}
  };

  const fetchLedgerStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/ledger-stats`, { headers: { "Authorization": `Bearer ${user?.token}` } });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.data) setLedgerStats(data.data);
    } catch (e) {}
  };

  const fetchDisputed = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/disputed-jobs`, { headers: { "Authorization": `Bearer ${user?.token}` } });
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.data)) setDisputedJobs(data.data);
    } catch (e) {}
  };

  const fetchPending = async () => {
    try {
      const adminToken = user?.token;
      const resAcc = await fetch(`${API_BASE}/admin/pending-providers`, { headers: { "Authorization": `Bearer ${adminToken}` } });
      const dataAcc = await resAcc.json().catch(() => ({}));
      if (resAcc.ok) {
        const pData = dataAcc.data || dataAcc.providers || dataAcc;
        setPendingProviders(Array.isArray(pData) ? pData : []);
      }
      const resVouch = await fetch(`${API_BASE}/admin/pending-vouching`, { headers: { "Authorization": `Bearer ${adminToken}` } });
      const dataVouch = await resVouch.json().catch(() => ({}));
      if (resVouch.ok) setPendingVouching(Array.isArray(dataVouch.data) ? dataVouch.data : []);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
          let roleQuery = "";
      if (roleFilter === "Service Providers") roleQuery = "provider";
      else if (roleFilter === "Customers") roleQuery = "customer";
      else if (roleFilter === "Admins") roleQuery = "admin";

      const res = await fetch(`${API_BASE}/admin/users?role=${roleQuery}`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const usersData = data.users || data.data?.users || data.data || data;
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/force-sync`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user?.token}`, "Cache-Control": "no-cache" }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showAlert("🔄 Database Reconciliation Complete");
        const usersData = data.users || data.data?.users || data.data || data;
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/queue`, { headers: { "Authorization": `Bearer ${user?.token}` } });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data)) setQueue(data);
      else if (data?.success && Array.isArray(data.data)) setQueue(data.data);
      else setQueue([]);
    } catch (e) { setQueue([]); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, { headers: { "Authorization": `Bearer ${user?.token}` } });
      const data = await res.json().catch(() => ({}));
      if (data.settings && Array.isArray(data.settings)) {
        const settingsObj = {};
        data.settings.forEach(s => { settingsObj[s.key] = s.value; });
        setSystemSettings(settingsObj);
      }
    } catch (e) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/system-logs`, { headers: { "Authorization": `Bearer ${user?.token}` } });
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.data)) setLogs(data.data);
      else setLogs([]);
    } catch (e) { setLogs([]); }
  };

  useEffect(() => {
    let interval;
    if (activeTab === "dashboard") {
      fetchUsers(); fetchStats(); fetchLedgerStats(); fetchDisputed();
      interval = setInterval(fetchStats, 10000);
    }
    if (activeTab === "verification") { fetchPending(); fetchQueue(); }
    if (activeTab === "users") fetchUsers();
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "settings") fetchSettings();
    return () => { if (interval) clearInterval(interval); };
  }, [activeTab]);

  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [roleFilter]);
  const handleUserAction = async (userId, action, data = {}) => {
    try {
      const adminToken = user?.token;
      let res;
      if (action === 'delete') res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === 'update') res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(data) });
      else if (action === 'create') res = await fetch(`${API_BASE}/admin/users`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(data) });
      else if (action === 'approve') res = await fetch(`${API_BASE}/admin/approve-provider/${userId}`, { method: "PATCH", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === 'flag') res = await fetch(`${API_BASE}/admin/flag-user/${userId}`, { method: "PATCH", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === "update_settings") {
        const key = Object.keys(data)[0];
        res = await fetch(`${API_BASE}/admin/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify({ key, value: data[key] })
        });
      } else if (action === "review_match") {
        res = await fetch(`${API_BASE}/admin/queue/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify(data)
        });
      } else if (action === "release_payout") {
        res = await fetch(`${API_BASE}/admin/release-payout/${userId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
      } else if (action === "refund_escrow") {
        res = await fetch(`${API_BASE}/admin/refund-escrow/${userId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
      } else if (action === 'queue_override') {
        res = await fetch(`${API_BASE}/admin/queue/override`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify(data)
        });
      }

      if (res && res.ok) {
        if (activeTab === "users") fetchUsers();
        if (activeTab === "verification") { fetchPending(); fetchQueue(); }
        if (activeTab === "dashboard") fetchStats();
        setModalVisible(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert(errData.error || "Action failed");
      }
    } catch (e) { showAlert("Error connecting to server"); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ backgroundColor: COLORS.slate }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", alignSelf: "center", padding: SPACING.md, paddingTop: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_700Bold", color: COLORS.white }}>Wantok Admin</Text>
            <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight }}>SaaS Control Portal</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={{ backgroundColor: COLORS.slateLight, paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs * 1.5, borderRadius: RADII.sm }}>
            <Text style={{ color: COLORS.bg, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", alignSelf: "center", flexDirection: "row" }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "users", label: "Users", icon: "👥" },
            { id: "verification", label: "Queue", icon: "⏳" },
            { id: "logs", label: "Logs", icon: "📜" },
            { id: "settings", label: "Controls", icon: "🎛️" },
          ].map((tab) => (
            <TouchableOpacity key={tab?.id} onPress={() => setActiveTab(tab.id)} style={{ flex: 1, paddingVertical: SPACING.md, alignItems: "center", borderBottomWidth: 3, borderBottomColor: activeTab === tab.id ? COLORS.primary :  "transparent" }}>
              <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, marginBottom: 2 }}>{tab.icon}</Text>
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: activeTab === tab.id ? COLORS.primary : COLORS.textMuted }}>{tab.label.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
          {activeTab === "dashboard" && (
            <View style={{ padding: SPACING.md, gap: SPACING.md }}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.sm }}>
                {[
                  { label: "TOTAL CUSTOMERS", val: stats?.totalCustomers || 0, color: COLORS.info },
                  { label: "TOTAL PROVIDERS", val: stats?.totalProviders || 0, color: COLORS.warning },
                  { label: "COMPLETED MATCHES", val: stats?.totalMatches || 0, color: COLORS.success },
                  { label: "ESCROW CAPITAL", val: `K${parseFloat(ledgerStats?.totalEscrowCapital || 0).toFixed(2)}`, color: COLORS.info },
                  { label: "PLATFORM REVENUE", val: `K${parseFloat(ledgerStats?.totalRevenue || 0).toFixed(2)}`, color: COLORS.accent }
                ].map((m, idx) => (
                  <View key={idx} style={{ flex: 1, backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, borderLeftWidth: 4, borderLeftColor: m.color, elevation: 2 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.textMuted, fontFamily: "Poppins_600SemiBold" }}>{m.label}</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_700Bold", color: COLORS.slate, marginTop: SPACING.xs }}>{m.val}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md }}>
                <View style={{ flex: isDesktop ? 2 : 1, gap: SPACING.md }}>
                  <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, elevation: 2 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.md }}>🚨 Critical Disputes (Milestone Arbitration)</Text>
                    {disputedJobs?.length === 0 ? (
                      <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize, fontStyle: "italic" }}>No active disputes requiring intervention.</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8, marginBottom: SPACING.sm }}>
                            <Text style={{ width: 150, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>SERVICE</Text>
                            <Text style={{ width: 120, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>CUSTOMER</Text>
                            <Text style={{ width: 100, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize, textAlign: "right" }}>AMOUNT</Text>
                            <Text style={{ width: 150, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize, textAlign: "center" }}>ACTIONS</Text>
                          </View>
                          {disputedJobs?.map(job => (
                <View key={job?.id || Math.random()} style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm }}>
                              <Text style={{ width: 150, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{job?.service_type}</Text>
                              <Text style={{ width: 120, fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>{job?.customer_name}</Text>
                              <Text style={{ width: 100, fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", textAlign: "right" }}>K{job?.price}</Text>
                  <View style={{ width: 150, flexDirection: "row", justifyContent: "center", gap: SPACING.sm }}>
                                <TouchableOpacity onPress={() => handleUserAction(job.id, "release_payout")} style={{ backgroundColor: COLORS.success, padding: SPACING.xs * 1.5, borderRadius: RADII.sm / 2 }}><Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Inter_600SemiBold" }}>RELEASE</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleUserAction(job.id, "refund_escrow")} style={{ backgroundColor: COLORS.danger, padding: SPACING.xs * 1.5, borderRadius: RADII.sm / 2 }}><Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Inter_600SemiBold" }}>REFUND</Text></TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    )}
                  </View>
                  <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, elevation: 2 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
                      <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate }}>👥 Recent User Activity</Text>
                      <TouchableOpacity onPress={() => setActiveTab("users")}><Text style={{ color: COLORS.primary, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>VIEW ALL →</Text></TouchableOpacity>
                    </View>
                    {users?.slice(0, 5)?.map(u => (
                      <View key={u?.id || Math.random()} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.bg }}>
            <View>
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.bodySmall.fontSize }}><Text numberOfLines={1}>{u?.name}</Text></Text>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>{u?.email}</Text>
                        </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ backgroundColor: u?.role === "provider" ? COLORS.bg : COLORS.bg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs / 2, borderRadius: RADII.sm / 2 }}>
                            <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: u?.role === "provider" ? COLORS.primaryDark : COLORS.info }}>{(u?.role || "").toUpperCase()}</Text>
                          </View>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.textLight, marginTop: SPACING.xs / 2 }}>{new Date(u?.created_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flex: isDesktop ? 1 : 1, gap: SPACING.md }}>
                  <View style={{ backgroundColor: COLORS.slate, borderRadius: RADII.md, padding: SPACING.md, elevation: 2 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.white, marginBottom: SPACING.sm }}>🛠️ Administrative Tools</Text>
                    <TouchableOpacity onPress={handleForceSync} style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.sm }}><Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>Database Force Reconciliation</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab("settings")} style={{ backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADII.sm }}><Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>Global System Controls</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "users" && (
            <View style={{ padding: SPACING.md }}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", alignItems: isDesktop ? "center" : "flex-start", marginBottom: SPACING.md, gap: SPACING.sm }}>
                <View style={{ flex: 1, width: "100%" }}>
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate }}>User Management</Text>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>Manage accounts across the platform</Text>
                </View>
                <View style={{ flexDirection: "row", gap: SPACING.sm, width: isDesktop ? "auto" : "100%" }}>
                  <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADII.sm, paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                    <Text>🔍</Text>
                    <TextInput placeholder="Search name/email..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, fontSize: TYPOGRAPHY.bodySmall.fontSize }} />
                  </View>
                  <TouchableOpacity onPress={() => { setEditingUser({ name: '', email: '', phone_number: '', role: 'customer', roles: ['customer'], is_verified: false, is_flagged: false }); setModalVisible(true); }} style={{ backgroundColor: COLORS.slate, paddingHorizontal: SPACING.md, justifyContent: "center", borderRadius: RADII.sm }}><Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.bodySmall.fontSize }}>+ ADD</Text></TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md, flexWrap: "wrap" }}>
                {["All Roles", "Service Providers", "Customers", "Admins"]?.map(f => (
                  <TouchableOpacity key={f} onPress={() => setRoleFilter(f)} style={{ paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs * 1.5, borderRadius: RADII.lg, backgroundColor: roleFilter === f ? COLORS.primary : COLORS.border, borderWidth: 1, borderColor: roleFilter === f ? COLORS.primary : COLORS.border }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: roleFilter === f ? COLORS.white : COLORS.textMuted }}>{f.toUpperCase()}</Text></TouchableOpacity>
                ))}
              </View>
              {loading ? (
                <View style={{ padding: SPACING.xl * 1.25, alignItems: "center" }}><Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>Loading records...</Text></View>
              ) : users?.length === 0 ? (
                <View style={{ padding: SPACING.xl * 1.25, alignItems: "center" }}><Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>No users found.</Text></View>
              ) : users?.filter(u => {
                  // 1. Strict Exclusions
                  const isNotMockProvider = (u.name || '').toLowerCase().trim() !== 'mock provider';
                  const isNotGeneralTrade = (u.category || u.trade_type || '').toLowerCase().trim() !== 'general trade';
                  const isAdmin = (u.role || '').toLowerCase() === 'admin' ||
                                  (u.role || '').toLowerCase() === 'master admin' ||
                                  u.isAdmin;
                  // Only hide admins if the filter is NOT set to Admins
                  if (!isNotMockProvider || !isNotGeneralTrade || (roleFilter !== "Admins" && isAdmin)) {
                    return false;
                  }
                  const q = (searchQuery || "").toLowerCase();
                  return (u?.name || "").toLowerCase().includes(q) || (u?.email || "").toLowerCase().includes(q) || (u.phone_number || "").toLowerCase().includes(q);
                })?.map(u => (
                <View key={u?.id || Math.random()} style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.sm, elevation: 1, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.xs }}>
                        <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}><Text numberOfLines={1}>{u?.name}</Text></Text>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight }}>{new Date(u?.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginBottom: SPACING.xs * 1.5 }}>{u?.email} • {u.phone_number}</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.slate, fontFamily: "Inter_500Medium", marginBottom: SPACING.xs * 1.5 }}>Balance: K{parseFloat(u?.balance || 0).toFixed(2)} • Status: {u?.status || 'active'}</Text>
                      {u?.roles?.includes('provider') && u?.trade_type && (<Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.primary, fontFamily: "Inter_500Medium", marginBottom: SPACING.xs * 1.5 }}>📍 {u?.city_location || 'PNG'} • {u?.trade_type}</Text>)}
                      <View style={{ flexDirection: "row", gap: SPACING.xs, marginTop: SPACING.xs, flexWrap: "wrap" }}>
                        {(Array.isArray(u?.roles) ? u?.roles : []).map(r => (
              <View key={r} style={{ backgroundColor: r === 'provider' ? COLORS.bg : (r === 'customer' ? COLORS.bg : COLORS.border), paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs * 0.75, borderRadius: RADII.sm }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: r === 'provider' ? COLORS.primaryDark : (r === 'customer' ? COLORS.info : COLORS.textMuted) }}>{r.toUpperCase()}</Text></View>
                        ))}
                        {u.is_verified && <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs * 0.75, borderRadius: RADII.sm, borderWidth: 1, borderColor: COLORS.border }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: COLORS.success }}>✅ VERIFIED</Text></View>}
                        {u.is_flagged && <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs * 0.75, borderRadius: RADII.sm, borderWidth: 1, borderColor: COLORS.border }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: COLORS.danger }}>🚩 FLAGGED</Text></View>}
                        {u?.status === 'suspended' && <View style={{ backgroundColor: COLORS.black, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs * 0.75, borderRadius: RADII.sm }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: COLORS.white }}>⛔ SUSPENDED</Text></View>}
                      </View>
                      <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: 12 }}>
                        <TouchableOpacity onPress={() => handleUserAction(u?.id, 'update', { role: u?.role === 'provider' ? 'customer' : 'provider' })} style={{ backgroundColor: COLORS.bg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADII.sm, borderWidth: 1, borderColor: COLORS.border }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted }}>Toggle Role</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleUserAction(u?.id, 'update', { status: u?.status === 'suspended' ? 'active' : 'suspended' })} style={{ backgroundColor: u?.status === 'suspended' ? COLORS.bg : COLORS.bg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADII.sm, borderWidth: 1, borderColor: u?.status === 'suspended' ? COLORS.border : COLORS.border }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Inter_600SemiBold", color: u?.status === 'suspended' ? COLORS.primaryDark : COLORS.danger }}>{u?.status === 'suspended' ? 'Activate' : 'Suspend'}</Text></TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: SPACING.xs }}>
                      <TouchableOpacity onPress={() => { setEditingUser({ ...u, role: u?.role || (u?.roles && u?.roles[0]) || 'customer' }); setModalVisible(true); }} style={{ width: 36, height: 36, borderRadius: RADII.lg, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize }}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleUserAction(u?.id, 'delete')} style={{ width: 36, height: 36, borderRadius: RADII.lg, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize }}>🗑️</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "verification" && (
            <View style={{ padding: SPACING.md }}>
              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.md }}>System Monitoring Queue</Text>
              <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.sm }}>ACTIVE MATCHES & JOBS</Text>
              {queue?.length === 0 ? (
                <View style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.lg, alignItems: "center" }}><Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>No active matching transactions</Text></View>
              ) : (
                queue?.map(item => {
                  const isAssigned = !!item.provider_id || item.status === 'accepted';
                  const statusLabel = item.status === 'accepted' ? 'ASSIGNED' : (item.status || "").toUpperCase();
                  const borderColor = item.status === 'completed' ? COLORS.success : (item.status === 'cancelled' ? COLORS.danger : (isAssigned ? COLORS.warning : COLORS.info));

                  return (
                    <TouchableOpacity
                      key={item?.id || Math.random()}
                      onPress={() => fetchMatchDetails(item.id)}
                      style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.sm, borderLeftWidth: 4, borderLeftColor: borderColor, elevation: 1 }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>{item?.service_type} Match</Text>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs / 2 }}><Text numberOfLines={1}>{item?.customer_name} ➔ {item?.provider_name || 'Automating...'}</Text></Text>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight, marginTop: SPACING.xs }}>ID: {item.id} • {new Date(item?.created_at).toLocaleString()}</Text>
                        </View>
                        <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADII.sm }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: COLORS.textMuted }}>{statusLabel}</Text></View>
                      </View>

                      <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: 12 }}>
                         <TouchableOpacity onPress={() => fetchMatchDetails(item.id)} style={{ flex: 1, backgroundColor: COLORS.bg, paddingVertical: SPACING.sm, borderRadius: RADII.sm, alignItems: "center", borderWidth: 1, borderColor: COLORS.border }}>
                           <Text style={{ color: COLORS.textMuted, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>View Details</Text>
                         </TouchableOpacity>
                         {(item.status === 'pending' || item.status === 'accepted') && (
                           <TouchableOpacity onPress={() => handleUserAction(item.id, 'review_match', { matchId: item.id, action: 'FLAGGED', internalNotes: 'Flagged from monitoring queue' })} style={{ flex: 1, backgroundColor: COLORS.bg, paddingVertical: SPACING.sm, borderRadius: RADII.sm, alignItems: "center", borderWidth: 1, borderColor: COLORS.border }}><Text style={{ color: COLORS.danger, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Flag / Review</Text></TouchableOpacity>
                         )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: 12 }}>PENDING VERIFICATIONS</Text>
              {(pendingProviders || [])?.length === 0 ? (
                <View style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center" }}><Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>No pending verifications</Text></View>
              ) : (
                pendingProviders?.map(prov => (
                  <View key={prov.id} style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.sm }}>
                    <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold" }}>{prov.name}</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>{prov.primary_skill || "Provider"}</Text>
                    <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: 12 }}>
                      <TouchableOpacity onPress={() => handleUserAction(prov.id, 'approve')} style={{ flex: 1, backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center" }}><Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold" }}>Approve</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleUserAction(prov.id, 'flag')} style={{ flex: 1, borderWidth: 1, borderColor: COLORS.danger, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center" }}><Text style={{ color: COLORS.danger, fontFamily: "Inter_600SemiBold" }}>Flag</Text></TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "settings" && (
            <ScrollView style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: SPACING.md }}>
                {[
                  { id: "verification_queue", label: "Trust Verification Queue" },
                  { id: "match_engine", label: "Match Engine Parameters" }
                ].map(st => (
                  <TouchableOpacity key={st.id} onPress={() => setActiveSubTab(st.id)} style={{ paddingVertical: SPACING.sm, marginRight: 20, borderBottomWidth: 2, borderBottomColor: activeSubTab === st.id ? COLORS.primary :  "transparent" }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: activeSubTab === st.id ? COLORS.primary : COLORS.textMuted }}>{st.label.toUpperCase()}</Text></TouchableOpacity>
                ))}
              </View>
              <ScrollView style={{ flex: 1, padding: SPACING.md }}>
                {activeSubTab === "verification_queue" && (
                  <View>
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.md }}>Account Verification Queue</Text>
                    {(pendingProviders || [])?.length === 0 ? (
                      <View style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center", marginBottom: SPACING.lg }}><Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>No pending profiles for review</Text></View>
                    ) : (
                      pendingProviders?.map(prov => (
            <View key={prov.id} style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.sm, flexDirection: "row", gap: SPACING.md }}>
              <View style={{ flex: 1 }}><Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>{prov.name}</Text><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.primary, fontFamily: "Inter_500Medium" }}>{prov.primary_skill || "General Trade"}</Text><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs }}>{prov.email} • {prov.phone_number}</Text></View>
              <View style={{ width: 120, gap: SPACING.sm }}><TouchableOpacity onPress={() => handleUserAction(prov.id, "approve")} style={{ backgroundColor: COLORS.success, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center" }}><Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Approve</Text></TouchableOpacity><TouchableOpacity onPress={() => handleUserAction(prov.id, "flag")} style={{ borderWidth: 1, borderColor: COLORS.danger, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center" }}><Text style={{ color: COLORS.danger, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Flag/Reject</Text></TouchableOpacity></View>
                        </View>
                      ))
                    )}
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.md, marginTop: 12 }}>🤝 Community Vouching Queue</Text>
                    {(pendingVouching || [])?.length === 0 ? (
                      <View style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center" }}><Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>No community vouchers pending</Text></View>
                    ) : (
                      pendingVouching?.map(vouch => (
            <View key={vouch.id} style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginBottom: SPACING.sm, flexDirection: "row", gap: SPACING.md }}>
              <View style={{ flex: 1 }}><Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate }}>Gatekeeper: {vouch.gatekeeper_name}</Text><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.primary, fontFamily: "Inter_600SemiBold" }}>{vouch.gatekeeper_role}</Text><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs }}>Contact: {vouch.gatekeeper_contact}</Text><View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} /><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.slate }}>Provider: <Text style={{ fontFamily: "Inter_600SemiBold" }}>{vouch.provider_name}</Text> ({vouch.provider_email})</Text></View>
              <View style={{ width: 100, gap: SPACING.sm, justifyContent: "center" }}><TouchableOpacity onPress={() => { fetch(`${API_BASE}/admin/vouch/${vouch.id}/approve`, { method: "POST", headers: { "Authorization": `Bearer ${user?.token}` } }).then(res => res.ok ? (showAlert("Vouch Approved"), fetchPending()) : showAlert("Approval failed")); }} style={{ backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center" }}><Text style={{ color: COLORS.white, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Verify</Text></TouchableOpacity></View>
                        </View>
                      ))
                    )}
                  </View>
                )}
                {activeSubTab === "match_engine" && (
                  <View>
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.md }}>Match Engine Parameters</Text>
                    <View style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, elevation: 2 }}>
                      <View style={{ marginBottom: SPACING.lg }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>PostGIS Search Radius (km)</Text><Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.primary }}>{systemSettings?.match_radius || 50} km</Text></View><TextInput keyboardType="numeric" value={String(systemSettings?.match_radius || 50)} onChangeText={(val) => setSystemSettings({ ...systemSettings, match_radius: val })} onBlur={() => handleUserAction(null, 'update_settings', { match_radius: systemSettings?.match_radius })} style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_500Medium" }} /></View>
                      <View style={{ marginBottom: SPACING.lg }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>Global Fee Metric (K)</Text><Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.success }}>K{parseFloat(systemSettings?.platform_fee || 0).toFixed(2)}</Text></View><TextInput keyboardType="numeric" value={String(systemSettings?.platform_fee || 0)} onChangeText={(val) => setSystemSettings({ ...systemSettings, platform_fee: val })} onBlur={() => handleUserAction(null, 'update_settings', { platform_fee: systemSettings?.platform_fee })} style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_500Medium" }} /></View>
                      <TouchableOpacity onPress={() => { fetch(`${API_BASE}/admin/match-config`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` }, body: JSON.stringify({ radius: systemSettings?.match_radius, fee: systemSettings?.platform_fee }) }).then(res => res.ok ? showAlert('Engine updated') : showAlert('Update failed')); }} style={{ backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center" }}><Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold" }}>PUSH ENGINE RELOAD</Text></TouchableOpacity>
                    </View>
                    <View style={{ backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADII.md, marginTop: SPACING.md }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>System Maintenance Mode</Text><TouchableOpacity onPress={() => { const newVal = !systemSettings?.maintenance_mode; setSystemSettings({ ...systemSettings, maintenance_mode: newVal }); handleUserAction(null, 'update_settings', { maintenance_mode: newVal }); }} style={{ width: 56, height: 30, borderRadius: 15, backgroundColor: systemSettings?.maintenance_mode ? COLORS.danger : COLORS.border, padding: 3, flexDirection: systemSettings?.maintenance_mode ? 'row-reverse' : 'row' }}><View style={{ width: 24, height: 24, borderRadius: RADII.md, backgroundColor: COLORS.white }} /></TouchableOpacity></View></View>
                  </View>
                )}
                <View style={{ height: 100 }} />
              </ScrollView>
            </ScrollView>
          )}

          {activeTab === "logs" && (
            <View style={{ padding: SPACING.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate }}>System Activity Logs</Text>
                <TouchableOpacity onPress={fetchLogs} style={{ backgroundColor: COLORS.bg, paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs * 1.5, borderRadius: RADII.sm, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: SPACING.xs * 1.5 }}><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize }}>🔄</Text><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted }}>REFRESH</Text></TouchableOpacity>
              </View>
              <View style={{ backgroundColor: COLORS.slate, borderRadius: RADII.md, padding: SPACING.md, borderLeftWidth: 4, borderLeftColor: COLORS.slateLight, elevation: 4, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.slate, paddingBottom: 8 }}><View style={{ width: 8, height: 8, borderRadius: RADII.sm / 2, backgroundColor: COLORS.success }} /><Text style={{ color: COLORS.textLight, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", letterSpacing: 1 }}>TTY1 / SYSTEM_SERVICE / STDOUT</Text></View>
                {(logs || [])?.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.caption.fontSize, fontStyle: "italic", textAlign: "center", padding: SPACING.md }}>- No active log stream -</Text>
                ) : (
                  logs?.map(log => (
                    <View key={log.id} style={{ marginBottom: SPACING.sm, flexDirection: "row", gap: SPACING.sm }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.caption.fontSize, width: 80, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</Text>
                      <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs * 1.5 }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: log.level === 'SEC' ? COLORS.danger : COLORS.info, backgroundColor: log.level === 'SEC' ? "rgba(248, 113, 113, 0.1)" : "rgba(34, 211, 238, 0.1)", paddingHorizontal: SPACING.xs, paddingVertical: 1, borderRadius: RADII.sm / 2 }}>{log.level}</Text><Text style={{ color: COLORS.border, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_500Medium", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.message}</Text></View>
                        <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.caption.fontSize, marginTop: SPACING.xs / 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>PID: {Math.floor(1000 + Math.random() * 9000)} / host.wantok.internal</Text>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.slate, paddingTop: 8 }}><Text style={{ color: COLORS.success, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>$ _</Text></View>
              </View>
            </View>
          )}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {isMatchDetailModalVisible && selectedMatch && (
        <Modal visible={isMatchDetailModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: SPACING.md }}>
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.lg, maxHeight: "90%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
                <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_700Bold", color: COLORS.slate }}>Relationship Explorer</Text>
                <TouchableOpacity onPress={() => setIsMatchDetailModalVisible(false)}><Text style={{ fontSize: TYPOGRAPHY.h2.fontSize }}>×</Text></TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Full Profile Linkage */}
                <View style={{ flexDirection: isDesktop ? "row" : "column", gap: SPACING.md, marginBottom: SPACING.lg }}>
                  <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md, borderRadius: RADII.md }}>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.sm }}>CUSTOMER PROFILE</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>{selectedMatch.booking.customer_name}</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs }}>{selectedMatch.booking.customer_email}</Text>
                    <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>{selectedMatch.booking.customer_phone}</Text>
                    <TouchableOpacity style={{ marginTop: 10 }}><Text style={{ color: COLORS.primary, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>View Full History →</Text></TouchableOpacity>
                  </View>
                  <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md, borderRadius: RADII.md }}>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.sm }}>PROVIDER PROFILE</Text>
                    {selectedMatch.booking.provider_id ? (
                      <>
                        <Text style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>{selectedMatch.booking.provider_name}</Text>
                        <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.primary, fontFamily: "Inter_500Medium" }}>{selectedMatch.booking.provider_skill}</Text>
                        <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs }}>{selectedMatch.booking.provider_email}</Text>
                        <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>{selectedMatch.booking.provider_phone}</Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontStyle: "italic", color: COLORS.textLight }}>No provider assigned yet.</Text>
                    )}
                  </View>
                </View>

                {/* 2. Job/Match Context */}
                <View style={{ marginBottom: SPACING.lg }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.sm }}>Job & Match Context</Text>
                  <View style={{ backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.md }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>Service Type:</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold" }}>{selectedMatch.booking.service_type}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>Current State:</Text>
                      <View style={{ backgroundColor: COLORS.slate, paddingHorizontal: 6, paddingVertical: SPACING.xs / 2, borderRadius: RADII.sm / 2 }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.white, fontFamily: "Poppins_600SemiBold" }}>{(selectedMatch.booking.status || "").toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>Created At:</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{new Date(selectedMatch.booking.created_at).toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted }}>Booking Price:</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.primary }}>K{selectedMatch.booking.price}</Text>
                    </View>
                  </View>
                </View>

                {/* 3. Match Criteria Scores */}
                <View style={{ marginBottom: SPACING.lg }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.sm }}>Proximity Match Scores</Text>
                  {selectedMatch.scores.length === 0 ? (
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight, fontStyle: "italic" }}>No match candidates recorded.</Text>
                  ) : (
                    selectedMatch.scores.map(score => (
                      <View key={score.id} style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm, backgroundColor: COLORS.white, padding: SPACING.sm, borderRadius: RADII.sm, borderWidth: 1, borderColor: COLORS.border }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold" }}>{score.provider_name}</Text>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>Candidate Score: {score.score}%</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleReassign(selectedMatch.booking.id, score.provider_id)} style={{ backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm * 1.5, paddingVertical: SPACING.xs * 1.5, borderRadius: RADII.sm }}>
                          <Text style={{ color: COLORS.white, fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold" }}>REASSIGN</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                {/* 4. History Logs */}
                <View style={{ marginBottom: SPACING.lg }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.sm }}>Audit History</Text>
                  {selectedMatch.logs.length === 0 ? (
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight, fontStyle: "italic" }}>No history logs found.</Text>
                  ) : (
                    selectedMatch.logs.map(log => (
                      <View key={log.id} style={{ borderLeftWidth: 2, borderLeftColor: COLORS.border, paddingLeft: 12, marginBottom: SPACING.sm }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold" }}>{log.action}</Text>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs / 2 }}>{log.internal_notes}</Text>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.textLight, marginTop: SPACING.xs }}>By: {log.admin_name || "System"} • {new Date(log.created_at).toLocaleString()}</Text>
                      </View>
                    ))
                  )}
                </View>

                {/* 5. Actionable Overrides */}
                <View style={{ marginBottom: SPACING.md }}>
                  <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Poppins_600SemiBold", color: COLORS.slate, marginBottom: SPACING.sm }}>Administrative Overrides</Text>
                  <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                    <TouchableOpacity onPress={() => handleUserAction(selectedMatch.booking.id, 'review_match', { matchId: selectedMatch.booking.id, action: 'FORCE_TERMINATED', internalNotes: 'Admin terminated match from relationship view' })} style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center", borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ color: COLORS.danger, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Break Match</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleUserAction(selectedMatch.booking.id, 'review_match', { matchId: selectedMatch.booking.id, action: 'FORCE_COMPLETED', internalNotes: 'Admin force completed match' })} style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center", borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ color: COLORS.success, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Force Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleUserAction(selectedMatch.booking.id, 'review_match', { matchId: selectedMatch.booking.id, action: 'CLEARED', internalNotes: 'Admin cleared flag' })} style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, alignItems: "center" }}>
                      <Text style={{ color: COLORS.textMuted, fontFamily: "Inter_600SemiBold", fontSize: TYPOGRAPHY.caption.fontSize }}>Clear Flags</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {modalVisible && (
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: SPACING.md }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.md, padding: SPACING.md, maxHeight: "90%" }}>
            <ScrollView>
              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: "Poppins_700Bold", color: COLORS.slate, marginBottom: SPACING.md }}>{editingUser?.id ? "Edit Account" : "Provision New Account"}</Text>
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.xs * 1.5 }}>FULL NAME</Text>
              <TextInput value={editingUser?.name} onChangeText={(t) => setEditingUser({...editingUser, name: t})} placeholder="e.g. John Doe" style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.md, fontSize: TYPOGRAPHY.bodySmall.fontSize }} />
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.xs * 1.5 }}>EMAIL ADDRESS</Text>
              <TextInput value={editingUser?.email} onChangeText={(t) => setEditingUser({...editingUser, email: t})} placeholder="e.g. john@example.com" autoCapitalize="none" style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.md, fontSize: TYPOGRAPHY.bodySmall.fontSize }} />
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.xs * 1.5 }}>PHONE NUMBER</Text>
              <TextInput value={editingUser?.phone_number} onChangeText={(t) => setEditingUser({...editingUser, phone_number: t})} placeholder="e.g. 70000000" style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.md, fontSize: TYPOGRAPHY.bodySmall.fontSize }} />
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.xs * 1.5 }}>NEW PASSWORD (OPTIONAL)</Text>
              <TextInput value={editingUser?.password} onChangeText={(t) => setEditingUser({...editingUser, password: t})} placeholder="Leave blank to keep current" secureTextEntry style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, marginBottom: SPACING.md, fontSize: TYPOGRAPHY.bodySmall.fontSize }} />
              <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.textMuted, marginBottom: SPACING.xs * 1.5 }}>SYSTEM ROLE</Text>
              <View style={{ flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md }}>{['customer', 'provider', 'admin'].map(r => (<TouchableOpacity key={r} onPress={() => setEditingUser({...editingUser, role: r, roles: [r]})} style={{ flex: 1, padding: SPACING.sm, borderRadius: RADII.sm, backgroundColor: editingUser?.role === r ? COLORS.primary : COLORS.bg, alignItems: "center" }}><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: "Poppins_600SemiBold", color: editingUser?.role === r ? COLORS.white : COLORS.textMuted }}>{r.toUpperCase()}</Text></TouchableOpacity>))}</View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}><View><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>Verified Status</Text><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>Trust badge visibility</Text></View><TouchableOpacity onPress={() => setEditingUser({...editingUser, is_verified: !editingUser?.is_verified})} style={{ width: 44, height: 24, borderRadius: RADII.md, backgroundColor: editingUser?.is_verified ? COLORS.success : COLORS.border, padding: SPACING.xs / 2 }}><View style={{ width: 20, height: 20, borderRadius: RADII.sm, backgroundColor: COLORS.white, transform: [{ translateX: editingUser?.is_verified ? 20 : 0 }] }} /></TouchableOpacity></View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg }}><View><Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.slate }}>Flag Account</Text><Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>Restrict access immediately</Text></View><TouchableOpacity onPress={() => setEditingUser({...editingUser, is_flagged: !editingUser?.is_flagged})} style={{ width: 44, height: 24, borderRadius: RADII.md, backgroundColor: editingUser?.is_flagged ? COLORS.danger : COLORS.border, padding: SPACING.xs / 2 }}><View style={{ width: 20, height: 20, borderRadius: RADII.sm, backgroundColor: COLORS.white, transform: [{ translateX: editingUser?.is_flagged ? 20 : 0 }] }} /></TouchableOpacity></View>
              <View style={{ flexDirection: "row", gap: SPACING.sm }}><TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, padding: SPACING.md, alignItems: "center" }}><Text style={{ fontFamily: "Inter_600SemiBold", color: COLORS.textMuted }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => handleUserAction(editingUser?.id, editingUser?.id ? 'update' : 'create', editingUser)} style={{ flex: 1, backgroundColor: COLORS.slate, padding: SPACING.md, borderRadius: RADII.md, alignItems: "center" }}><Text style={{ fontFamily: "Poppins_600SemiBold", color: COLORS.white }}>{editingUser?.id ? "Update Account" : "Create User"}</Text></TouchableOpacity></View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}


function CustomerInboxScreen({ user, showAlert }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/inbox`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch (e) {
      console.error("Inbox fetch failed:", e);
    }
  };

  const fetchChatHistory = async (otherId, providerId) => {
    try {
      const res = await fetch(`${API_BASE}/messages?providerId=${providerId}&userId=${user.id}`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error("Chat history fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (selectedConv) {
      fetchChatHistory(selectedConv.other_party_id, selectedConv.provider_id);
      interval = setInterval(() => fetchChatHistory(selectedConv.other_party_id, selectedConv.provider_id), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedConv]);

  const handleSendReply = async () => {
    if (!replyText.trim() && selectedFiles.length === 0) return;
    if (!selectedConv) return;

    try {
      const sendPayload = async (fileData = null) => {
        const body = {
          receiverId: selectedConv.other_party_id,
          providerId: selectedConv.provider_id,
          text: replyText.trim()
        };
        if (fileData) {
          body.fileUrl = fileData.url;
          body.fileName = fileData.name;
          body.fileType = fileData.type;
        }

        const res = await fetch(`${API_BASE}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user?.token}`
          },
          body: JSON.stringify(body)
        });
        return res.ok;
      };

      if (selectedFiles.length> 0) {
        for (const file of selectedFiles) {
          const simulatedUrl = Platform.OS === 'web' ? URL.createObjectURL(file) : 'https://via.placeholder.com/150';
          await sendPayload({ url: simulatedUrl, name: file.name, type: file.type });
        }
      } else {
        await sendPayload();
      }

      setReplyText("");
      setSelectedFiles([]);
      fetchChatHistory(selectedConv.other_party_id, selectedConv.provider_id);
    } catch (e) {
      showAlert("Failed to send reply");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        {/* Left Sidebar: Inbox List */}
        <View style={{ width: isDesktop ? 350 : '100%', borderRightWidth: isDesktop ? 1 : 0, borderRightColor: COLORS.border, borderBottomWidth: isDesktop ? 0 : 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white }}>
          <View style={{ padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Poppins_600SemiBold', color: COLORS.text }}>Inbox</Text>
          </View>
          <ScrollView>
            {(conversations || [])?.length === 0 ? (
              <View style={{ padding: SPACING.xl * 1.25, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>No conversations yet.</Text>
              </View>
            ) : conversations.map((conv, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedConv(conv)}
                style={{
                  padding: SPACING.md,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.bg,
                  backgroundColor: selectedConv?.other_party_id === conv.other_party_id ? COLORS.bg : COLORS.white
                }}
>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: RADII.pill, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.white, fontFamily: 'Poppins_600SemiBold' }}>{conv.other_party_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: COLORS.text }}>{conv.other_party_name}</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.textMuted }}>{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.primary, fontFamily: 'Inter_500Medium', marginTop: SPACING.xs / 2 }}>{conv.other_party_category || 'Service Provider'}</Text>
                    <Text numberOfLines={1} style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs / 2 }}>{conv.last_message}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Chat Window */}
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {selectedConv ? (
            <View style={{ flex: 1 }}>
              <View style={{ padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                {!isDesktop && (
                  <TouchableOpacity onPress={() => setSelectedConv(null)} style={{ marginRight: 8 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>⬅️</Text>
                  </TouchableOpacity>
                )}
                <View style={{ width: 36, height: 36, borderRadius: RADII.lg, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: COLORS.white, fontFamily: 'Inter_600SemiBold', fontSize: TYPOGRAPHY.caption.fontSize }}>{selectedConv.other_party_name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: COLORS.text }}>{selectedConv.other_party_name}</Text>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>{selectedConv.other_party_category || 'Service Provider'}</Text>
                </View>
              </View>

              <ScrollView style={{ flex: 1, padding: SPACING.md }}>
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user?.id;
                  return (

                    <View key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? COLORS.primary : COLORS.white, padding: SPACING.sm, borderRadius: RADII.md, marginBottom: SPACING.sm, maxWidth: '80%', elevation: 1 }}>
                      {msg.file_url && (
                        <View style={{ marginBottom: SPACING.sm }}>
                          {msg.file_type && msg.file_type.startsWith('image/') ? (
                            <TouchableOpacity onPress={() => showAlert("Image preview modal here")}>
                              <Image source={{ uri: msg.file_url }} style={{ width: 200, height: 150, borderRadius: RADII.sm, resizeMode: 'cover' }} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity onPress={() => { if (Platform.OS === 'web') window.open(msg.file_url, '_blank'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(0,0,0,0.05)', padding: SPACING.sm, borderRadius: RADII.sm }}>
                              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>📄</Text>
                              <View style={{ flex: 1 }}>
                                <Text numberOfLines={1} style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: isMine ? COLORS.white : COLORS.text }}>{msg.file_name}</Text>
                                <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }}>{msg.file_type || 'Document'}</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      <Text style={{ color: isMine ? COLORS.white : COLORS.text, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{msg.text}</Text>

                      <Text style={{ color: isMine ? COLORS.white : COLORS.text, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{msg.text}</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 2, color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted, marginTop: SPACING.xs, textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>


              {selectedFiles.length> 0 && (
                <View style={{ padding: SPACING.sm, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                    {selectedFiles.map((file, fIdx) => (
                      <View key={fIdx} style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs * 1.5 }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_500Medium', maxWidth: 120 }} numberOfLines={1}>{file.name}</Text>
                        <TouchableOpacity onPress={() => removeFile(fIdx)} style={{ backgroundColor: COLORS.border, width: 18, height: 18, borderRadius: RADII.sm/2, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: 'Poppins_700Bold', color: COLORS.white }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ padding: SPACING.md, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style={{ display: 'none' }} />
                <TouchableOpacity onPress={() => fileInputRef.current?.click()} style={{ width: 44, height: 44, borderRadius: RADII.pill, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>📎</Text>
                </TouchableOpacity>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Type your reply..."
                  style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.sm, fontSize: TYPOGRAPHY.bodySmall.fontSize }}
                  multiline
 />
                <TouchableOpacity onPress={handleSendReply} style={{ backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADII.md }}>
                  <Text style={{ color: COLORS.white, fontFamily: 'Poppins_600SemiBold' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize + 12, marginBottom: SPACING.md }}>💬</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: 'Inter_500Medium' }}>Select a conversation to start chatting</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
function ProviderInboxScreen({ user, showAlert }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [loading, setLoading] = useState(false);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/inbox`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch (e) {
      console.error("Inbox fetch failed:", e);
    }
  };

  const fetchChatHistory = async (otherId) => {
    try {
      const res = await fetch(`${API_BASE}/messages?providerId=${user.id}&userId=${otherId}`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error("Chat history fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (selectedConv) {
      fetchChatHistory(selectedConv.other_party_id);
      interval = setInterval(() => fetchChatHistory(selectedConv.other_party_id), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedConv]);

  const handleSendReply = async () => {
    if (!replyText.trim() && selectedFiles.length === 0) return;
    if (!selectedConv) return;

    try {
      const sendPayload = async (fileData = null) => {
        const body = {
          receiverId: selectedConv.other_party_id,
          providerId: user.id,
          text: replyText.trim()
        };
        if (fileData) {
          body.fileUrl = fileData.url;
          body.fileName = fileData.name;
          body.fileType = fileData.type;
        }

        const res = await fetch(`${API_BASE}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user?.token}`
          },
          body: JSON.stringify(body)
        });
        return res.ok;
      };

      if (selectedFiles.length> 0) {
        for (const file of selectedFiles) {
          const simulatedUrl = Platform.OS === 'web' ? URL.createObjectURL(file) : 'https://via.placeholder.com/150';
          await sendPayload({ url: simulatedUrl, name: file.name, type: file.type });
        }
      } else {
        await sendPayload();
      }

      setReplyText("");
      setSelectedFiles([]);
      fetchChatHistory(selectedConv.other_party_id);
    } catch (e) {
      showAlert("Failed to send reply");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        {/* Left Sidebar: Inbox List */}
        <View style={{ width: isDesktop ? 350 : '100%', borderRightWidth: isDesktop ? 1 : 0, borderRightColor: COLORS.border, borderBottomWidth: isDesktop ? 0 : 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white }}>
          <View style={{ padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Poppins_600SemiBold', color: COLORS.text }}>Inbox</Text>
          </View>
          <ScrollView>
            {(conversations || [])?.length === 0 ? (
              <View style={{ padding: SPACING.xl * 1.25, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>No conversations yet.</Text>
              </View>
            ) : conversations.map((conv, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedConv(conv)}
                style={{
                  padding: SPACING.md,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.bg,
                  backgroundColor: selectedConv?.other_party_id === conv.other_party_id ? COLORS.bg : COLORS.white
                }}
>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: RADII.pill, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.white, fontFamily: 'Poppins_600SemiBold' }}>{conv.other_party_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: COLORS.text }}>{conv.other_party_name}</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: COLORS.textMuted }}>{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginTop: SPACING.xs / 2 }}>{conv.last_message}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Chat Window */}
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {selectedConv ? (
            <View style={{ flex: 1 }}>
              <View style={{ padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                {!isDesktop && (
                  <TouchableOpacity onPress={() => setSelectedConv(null)} style={{ marginRight: 8 }}>
                    <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>⬅️</Text>
                  </TouchableOpacity>
                )}
                <View style={{ width: 36, height: 36, borderRadius: RADII.lg, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: COLORS.white, fontFamily: 'Inter_600SemiBold', fontSize: TYPOGRAPHY.caption.fontSize }}>{selectedConv.other_party_name.charAt(0)}</Text>
                </View>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: COLORS.text }}>{selectedConv.other_party_name}</Text>
              </View>

              <ScrollView style={{ flex: 1, padding: SPACING.md }}>
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user?.id;

return (

                    <View key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? COLORS.primary : COLORS.white, padding: SPACING.sm, borderRadius: RADII.md, marginBottom: SPACING.sm, maxWidth: '80%', elevation: 1 }}>
                      {msg.file_url && (
                        <View style={{ marginBottom: SPACING.sm }}>
                          {msg.file_type && msg.file_type.startsWith('image/') ? (
                            <TouchableOpacity onPress={() => showAlert("Image preview modal here")}>
                              <Image source={{ uri: msg.file_url }} style={{ width: 200, height: 150, borderRadius: RADII.sm, resizeMode: 'cover' }} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity onPress={() => { if (Platform.OS === 'web') window.open(msg.file_url, '_blank'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(0,0,0,0.05)', padding: SPACING.sm, borderRadius: RADII.sm }}>
                              <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>📄</Text>
                              <View style={{ flex: 1 }}>
                                <Text numberOfLines={1} style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_600SemiBold', color: isMine ? COLORS.white : COLORS.text }}>{msg.file_name}</Text>
                                <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }}>{msg.file_type || 'Document'}</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      <Text style={{ color: isMine ? COLORS.white : COLORS.text, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{msg.text}</Text>

                      <Text style={{ color: isMine ? COLORS.white : COLORS.text, fontSize: TYPOGRAPHY.bodySmall.fontSize }}>{msg.text}</Text>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 2, color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted, marginTop: SPACING.xs, textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>


              {selectedFiles.length> 0 && (
                <View style={{ padding: SPACING.sm, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                    {selectedFiles.map((file, fIdx) => (
                      <View key={fIdx} style={{ backgroundColor: COLORS.bg, padding: SPACING.sm, borderRadius: RADII.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs * 1.5 }}>
                        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: 'Inter_500Medium', maxWidth: 120 }} numberOfLines={1}>{file.name}</Text>
                        <TouchableOpacity onPress={() => removeFile(fIdx)} style={{ backgroundColor: COLORS.border, width: 18, height: 18, borderRadius: RADII.sm/2, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize - 1, fontFamily: 'Poppins_700Bold', color: COLORS.white }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ padding: SPACING.md, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style={{ display: 'none' }} />
                <TouchableOpacity onPress={() => fileInputRef.current?.click()} style={{ width: 44, height: 44, borderRadius: RADII.pill, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize }}>📎</Text>
                </TouchableOpacity>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Type your reply..."
                  style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: RADII.md, padding: SPACING.sm, fontSize: TYPOGRAPHY.bodySmall.fontSize }}
                  multiline
 />
                <TouchableOpacity onPress={handleSendReply} style={{ backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADII.md }}>
                  <Text style={{ color: COLORS.white, fontFamily: 'Poppins_600SemiBold' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: TYPOGRAPHY.h1.fontSize + 12, marginBottom: SPACING.md }}>💬</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.body.fontSize, fontFamily: 'Inter_500Medium' }}>Select a conversation to start chatting</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [customAlert, setCustomAlert] = useState({ visible: false, message: '' });
  const showAlert = (message) => setCustomAlert({ visible: true, message });
  const [workers, setWorkers] = useState(null);

  useEffect(() => {
    const fetchInitialWorkers = async () => {
      try {
        const res = await fetch(`${API_BASE}/match/nearby`);
        const data = await res.json();
        if (data.success && Array.isArray(data.workers)) {
          setWorkers(data.workers);
        } else {
          setWorkers([]);
        }
      } catch (e) {
        setWorkers([]);
      }
    };
    fetchInitialWorkers();
  }, []);
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [screenData, setScreenData] = useState(null);

  useEffect(() => {
    if (screen === "admin-auth" && isAuthenticated && user?.roles?.includes('admin')) {
      setCurrentUser('admin');
      setScreen('admin');
      setOnboardingComplete(true);
    }
  }, [screen, isAuthenticated, user]);

  useEffect(() => {
    if (Platform.OS === "web") {
      // capture token from query string (PWA / Web Redirects)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const onboarding = urlParams.get('onboarding');
      if (token) {
        handleAuth({ token, onboarding: onboarding === '1' }, false);
        window.history.replaceState({}, "", "/");
      }

      const path = window.location.pathname;
      if (path === "/@dm1n") {
        setScreen("admin-auth");
      }

      try {
        const savedUser = localStorage.getItem("wantok_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          handleAuth(parsed, false);
        }
      } catch (e) {}
    } else {
      // Native Session Restore
      const restoreNativeSession = async () => {
        try {
          const savedUser = await AsyncStorage.getItem("wantok_user");
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            handleAuth(parsed, false);
          }
        } catch (e) {}
      };
      restoreNativeSession();
    }
  }, []);

  const navigate = (to, data = null) => {
    setScreen(to);
    setScreenData(data);
  };

  const handleAuth = async (userData, isSignUp = false) => {
    // If only token is provided (OAuth), fetch full profile
    let fullUser = userData;
    if (userData.token && !userData.email) {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        const data = await response.json();
        if (data.success) {
          fullUser = { ...data.user, token: userData.token, onboarding: userData.onboarding };
        }
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    }

    setUser(fullUser);
    if (Platform.OS === 'web') {
      localStorage.setItem('wantok_user', JSON.stringify(fullUser));
    } else {
      await AsyncStorage.setItem('wantok_user', JSON.stringify(fullUser));
    }
    setIsAuthenticated(true);
    if (isSignUp || fullUser.onboarding) {
      if (fullUser.onboarding) {
        setCurrentUser(fullUser.role);
        setOnboardingComplete(false);
      } else {
        setCurrentUser(null);
        setOnboardingComplete(false);
      }
    } else {
      // Handle login with existing persona
      const persona = fullUser.active_persona || (fullUser.roles && fullUser.roles[0]) || 'customer';
      setCurrentUser(persona);
      if (persona === "admin") setScreen("admin");

      // If provider, check if they have completed profile (role/location)
      if (persona === 'provider' && (!fullUser.primary_skill || !fullUser.location_name)) {
        setOnboardingComplete(false);
      } else {
        setOnboardingComplete(true);
      }
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('wantok_user');
    } else {
      await AsyncStorage.removeItem('wantok_user');
    }
    setIsAuthenticated(false);
    setUser(null);
    setCurrentUser(null);
    setOnboardingComplete(false);
    setScreen("home");
  };

    const renderScreen = () => {
    if (screen === "admin-auth") {
      return <AdminAuthScreen showAlert={showAlert} onAuth={(data) => { if (Platform.OS === "web") window.history.replaceState({}, "", "/"); handleAuth(data); }} />;
    }

    if (screen === "admin" && (!user?.roles?.includes('admin') || currentUser !== 'admin')) {
      showAlert("Unauthorized access attempt.");
      handleLogout();
      return <AuthScreen showAlert={showAlert} onAuth={handleAuth} />;
    }

    if (!isAuthenticated) {
      return <AuthScreen showAlert={showAlert} onAuth={handleAuth} />;
    }
    if (!currentUser) {
      return <RoleSelectionScreen showAlert={showAlert} onSelectRole={async (role) => {
        setCurrentUser(role);
        if (role === "customer") setOnboardingComplete(true);
        else setOnboardingComplete(false);
        try { await fetch(`${API_BASE}/auth/select-role`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` }, body: JSON.stringify({ role }) }); } catch (e) { console.error("Role selection persistence failed", e); }
      }} />;
    }

    if (currentUser === "provider" && !onboardingComplete) {
      return <ProviderOnboardingScreen user={user} showAlert={showAlert} onComplete={(details) => {
        setUser({ ...user, ...details });
        setOnboardingComplete(true);
      }} />;
    }

    switch (screen) {
      case "home": return <HomeScreen onNavigate={navigate} currentUser={currentUser} user={user} onUpdateUser={(updated) => setUser(updated)} showAlert={showAlert} />;
      case "workerDetail": return <WorkerDetailScreen worker={screenData} onNavigate={navigate} showAlert={showAlert} />;
      case "createBooking": return <CreateBookingScreen worker={screenData} onNavigate={navigate} user={user} showAlert={showAlert} />;
      case "booking": return <BookingsScreen onNavigate={navigate} user={user} showAlert={showAlert} currentUser={currentUser} />;
      case "trust": return <TrustScreen onNavigate={navigate} showAlert={showAlert} user={user} />;
      case "admin": return <AdminScreen onNavigate={navigate} onLogout={handleLogout} user={user} showAlert={showAlert} screenData={screenData} />;
      case "messages":
        if (currentUser === 'provider') return <ProviderInboxScreen user={user} showAlert={showAlert} />;
        return <CustomerInboxScreen user={user} showAlert={showAlert} />;
      case "profile": return <ProfileScreen onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} user={user} onUpdateUser={(updated) => setUser(updated)} showAlert={showAlert} />;
      case "active_jobs":
        return (
          <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text }}>Active Jobs</Text>
            <Text style={{ marginTop: 8, color: COLORS.textMuted }}>No active jobs at the moment.</Text>
          </View>
        );
      case "earnings":
        return (
          <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Inter_600SemiBold', color: COLORS.text }}>Earnings</Text>
            <Text style={{ marginTop: 8, color: COLORS.textMuted }}>K0.00</Text>
          </View>
        );
      default: return <HomeScreen onNavigate={navigate} currentUser={currentUser} user={user} onUpdateUser={(updated) => setUser(updated)} showAlert={showAlert} />;
    }
  };

  const activeNav = ["home", "trust", "booking", "profile", "active_jobs", "earnings"].includes(screen)
    ? screen
    : "home";


  if (!fontsLoaded || !workers || !Array.isArray(workers)) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: SPACING.md }}>
        <View style={{ alignItems: 'center' }}>
          <Body style={{ color: COLORS.textMuted, fontFamily: 'Inter_500Medium' }}>
            Loading Wantok Workforce...
          </Body>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.statusBar }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.statusBar} />
      <View style={{ flex: 1, width: "100%" }}>
        {/* App Header Brand */}
        <View
          style={{
            backgroundColor: COLORS.statusBar,
            height: 50,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: SPACING.md,
            gap: SPACING.sm,
          }}
>
          <Image
            source={require("./assets/brand_logo.jpg")}
            style={{ width: 32, height: 32, borderRadius: RADII.md, resizeMode: "contain" }}
 />
          <Text
            style={{
              color: COLORS.white,
              fontFamily: "Poppins_700Bold",
              fontSize: TYPOGRAPHY.body.fontSize,
              letterSpacing: 0.5,
            }}
>
            WANTOK WORKFORCE
          </Text>
        </View>

        {/* Isolated Role-Specific Layout Shells */}
        {!isAuthenticated || !currentUser ? (
          <View style={{ flex: 1, backgroundColor: COLORS.bg }}>{renderScreen()}</View>
        ) : currentUser === 'admin' ? (
          <AdminNavigationShell renderScreen={renderScreen} />
        ) : currentUser === 'provider' ? (
          <ProviderNavigationShell
            renderScreen={renderScreen}
            navigate={navigate}
            activeNav={activeNav}
            onboardingComplete={onboardingComplete}
 />
        ) : (
          <CustomerNavigationShell
            renderScreen={renderScreen}
            navigate={navigate}
            activeNav={activeNav}
            onboardingComplete={onboardingComplete}
 />
        )}
      </View>

      {customAlert.visible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md, zIndex: 1000 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADII.lg, padding: SPACING.lg, maxWidth: 350, width: '100%', elevation: 20, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10 }}>
            <Text style={{ fontSize: TYPOGRAPHY.h3.fontSize, fontFamily: 'Poppins_700Bold', color: COLORS.primaryDark, marginBottom: SPACING.sm, textAlign: 'center' }}>WANTOK WORKFORCE</Text>
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: COLORS.textMuted, marginBottom: SPACING.lg, textAlign: 'center', lineHeight: 20 }}>{customAlert.message}</Text>
            <TouchableOpacity
              onPress={() => setCustomAlert({ visible: false, message: "" })}
              style={{ backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.md, borderRadius: RADII.md, alignItems: 'center' }}
>
              <Text style={{ color: COLORS.white, fontFamily: 'Inter_600SemiBold', fontSize: TYPOGRAPHY.body.fontSize }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function WorkerCard({ worker, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: RADII.lg,
        padding: SPACING.md,
        elevation: 2,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        flexDirection: "row",
        gap: SPACING.md - 2,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
>
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[COLORS.info, COLORS.primaryDark]}
          style={{
            width: 56,
            height: 56,
            borderRadius: RADII.md,
            alignItems: "center",
            justifyContent: "center",
          }}
>
          <Text style={{ color: COLORS.white, fontFamily: "Poppins_600SemiBold", fontSize: TYPOGRAPHY.h3.fontSize }}>
            {(worker?.name || "W").charAt(0)}
          </Text>
        </LinearGradient>
        {worker?.is_available && (
          <View
            style={{
              position: "absolute",
              bottom: -3,
              right: -3,
              width: 16,
              height: 16,
              borderRadius: RADII.sm,
              backgroundColor: COLORS.success,
              borderWidth: 2,
              borderColor: COLORS.white,
            }}
 />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs * 1.5 }}>
              <Text
                style={{ fontSize: TYPOGRAPHY.body.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.text }}
>
                <Text numberOfLines={1}>{worker?.name || "Anonymous Worker"}</Text>
              </Text>
              {worker?.is_verified && <TrustBadge />}
            </View>
            <Text
              style={{
                marginTop: SPACING.xs / 2,
                fontSize: TYPOGRAPHY.bodySmall.fontSize,
                color: COLORS.primary,
                fontFamily: "Inter_500Medium",
              }}
>
              {worker?.primary_skill || "General Trade"}
            </Text>
                        {(() => {
              // Check every possible database key variation for the registered signup number
              const registeredNumber = worker?.phone ||
                                       worker?.phoneNumber ||
                                       worker?.mobile ||
                                       worker?.phone_number ||
                                       (worker?.username && /^\d+$/.test(worker?.username) ? worker?.username : '');

              if (registeredNumber) {
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, gap: SPACING.xs }}>
                    <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight }}>📞</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${String(registeredNumber).trim()}`)}>
                      <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.primaryDark, fontFamily: 'Poppins_600SemiBold', textDecorationLine: 'underline' }}>
                        {registeredNumber}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, gap: SPACING.xs }}>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight }}>📞</Text>
                  <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textLight, fontStyle: 'italic' }}>No contact info</Text>
                </View>
              );
            })()}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.sm,
            marginVertical: 6,
          }}
>
          <StarRating rating={worker?.rating || 5.0} />
          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_500Medium", color: COLORS.text }}>
            {worker?.rating || "5.0"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
            <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: COLORS.textMuted }}>
              📍 {worker?.distance_km
                ? parseFloat(worker?.distance_km || 0).toFixed(1) + " km away"
                : worker?.location_name || "Port Moresby"}
            </Text>
          </View>
          {worker?.hourly_rate && (
            <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, fontFamily: "Inter_600SemiBold", color: COLORS.primary }}>
              K{worker?.hourly_rate}/hr
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
