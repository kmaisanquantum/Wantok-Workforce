import React, { useState, useEffect } from "react";
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
  RefreshControl, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import categories from "./categories.json";

const { width, height: screenHeight } = Dimensions.get("window");
const isDesktop = width > 1024;
const isTablet = width > 768;
const MAX_WIDTH = 1280;
const CONTENT_PADDING = isDesktop ? 40 : 16;
const API_BASE = (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL) || ((typeof window !== "undefined" && window.location.hostname === "localhost") ? "http://localhost:3000/api" : "/api");
console.log('🔗 Active Backend Pipeline API Path Set to:', API_BASE);

const COLORS = {
  primary: "#1A6B3C",
  primaryLight: "#2E9E5B",
  primaryDark: "#0F4024",
  secondary: "#3B82F6",
  accent: "#F5A623",
  accentDark: "#C47F0A",
  bg: "#F0F4F0",
  card: "#FFFFFF",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  danger: "#EF4444",
  info: "#3B82F6",
  border: "#E5E7EB",
  statusBar: "#0F4024",
};

const ResponsiveContainer = ({ children }) => (
  <View style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: CONTENT_PADDING }}>
    {children}
  </View>
);

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "booking", label: "Bookings", icon: "📅" },
  { key: "trust", label: "Trust", icon: "🛡️" },
  { key: "profile", label: "Profile", icon: "👤" },
];

const StarRating = ({ rating }) => {
  const stars = Math.round(rating);
  return (
    <View style={{ flexDirection: "row" }}>
      <Text style={{ color: COLORS.accent, fontSize: 12 }}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </Text>
    </View>
  );
};

const TrustBadge = () => (
  <LinearGradient
    colors={[COLORS.primary, COLORS.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
    }}
  >
    <Text style={{ color: "#fff", fontSize: 10 }}>✓</Text>
    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Verified</Text>
  </LinearGradient>
);

// ─── SCREENS ───────────────────────────────────────────────────────────────

function ProviderVouchingForm({ user, onVouchSubmitted }) {
  const [gatekeeper, setGatekeeper] = useState({ name: '', role: '', contact: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!gatekeeper.name || !gatekeeper.role || !gatekeeper.contact) {
      alert("Please fill in all gatekeeper details.");
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
        alert("Verification request sent to community gatekeeper!");
        onVouchSubmitted();
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, elevation: 4, marginTop: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 }}>🤝 Community Vouching</Text>
      <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>Verify your skills via a community leader (Church, Village, or School).</Text>
      <TextInput placeholder="Gatekeeper Name (e.g. Pastor John)" value={gatekeeper.name} onChangeText={(v) => setGatekeeper({...gatekeeper, name: v})} style={{ backgroundColor: COLORS.bg, borderRadius: 10, padding: 12, marginBottom: 10 }} />
      <TextInput placeholder="Gatekeeper Role (e.g. Village Councillor)" value={gatekeeper.role} onChangeText={(v) => setGatekeeper({...gatekeeper, role: v})} style={{ backgroundColor: COLORS.bg, borderRadius: 10, padding: 12, marginBottom: 10 }} />
      <TextInput placeholder="Contact Phone / Email" value={gatekeeper.contact} onChangeText={(v) => setGatekeeper({...gatekeeper, contact: v})} style={{ backgroundColor: COLORS.bg, borderRadius: 10, padding: 12, marginBottom: 16 }} />
      <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>{isSubmitting ? "SENDING..." : "SUBMIT FOR VALIDATION"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProviderFinancialDashboard({ user }) {
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

  if (loading) return <Text style={{ textAlign: 'center', padding: 20 }}>Loading Ledger...</Text>;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: COLORS.primaryDark, borderRadius: 20, padding: 24, flexDirection: isDesktop ? "row" : "column", gap: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>TOTAL EARNED (PGK)</Text>
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 }}>K{Number(ledger.metrics.totalEarned).toFixed(2)}</Text>
        </View>
        <View style={{ height: isDesktop ? 60 : 1, width: isDesktop ? 1 : "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>IN ESCROW</Text>
          <Text style={{ color: COLORS.accent, fontSize: 24, fontWeight: "800", marginTop: 4 }}>K{Number(ledger.metrics.fundsInEscrow).toFixed(2)}</Text>
        </View>
        <View style={{ height: isDesktop ? 60 : 1, width: isDesktop ? 1 : "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>MOBILE WALLET</Text>
          <Text style={{ color: "#10B981", fontSize: 24, fontWeight: "800", marginTop: 4 }}>K{Number(ledger.metrics.withdrawnToWallet).toFixed(2)}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginTop: 8 }}>📜 Permanent Employment Record</Text>
      {ledger.history.length === 0 ? (
        <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border }}>
          <Text style={{ color: COLORS.textMuted }}>No completed job cards found.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {ledger.history.map((job) => (
            <View key={job.id} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2, borderLeftWidth: 6, borderLeftColor: COLORS.primary }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>{job.service_type}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Client: {job.customer_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.primary }}>K{Number(job.price).toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.textLight, textAlign: 'right' }}>{new Date(job.completed_at || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 12 }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>⭐</Text>
                  <Text style={{ fontWeight: "700", color: COLORS.accent }}>{job.feedback_rating || 5.0} Rating</Text>
                </View>
                <View style={{ backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#166534" }}>VERIFIED RECORD</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function HomeScreen({ onNavigate, currentUser, user, onUpdateUser }) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
    const lat = -9.4438;
    const lon = 147.1803;

    try {
      const url = `${API_BASE}/match/nearby?latitude=${lat}&longitude=${lon}${(selectedCategory || searchText) ? '&trade_category=' + encodeURIComponent(selectedCategory || searchText) : ''}`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

      if (response.ok) {
        setNearbyWorkers(data.workers);
      } else {
        alert(data.error || "Matching engine failed.");
      }
    } catch (error) {
      console.error("Match fetch failed:", error);
      alert("Network error while searching.");
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
      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
        setIsUpdateModalVisible(false);
        onUpdateUser({ ...user, primary_skill: profileForm.primary_skill, hourly_rate: profileForm.hourly_rate });
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      alert("Network error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchVerification = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/providers/verification-status`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) setVStatus(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (!searchText && !selectedCategory) {
      setFiltered([]);
      setNearbyWorkers([]);
    }
  }, [searchText, selectedCategory]);

  useEffect(() => {
    if (currentUser === "provider") {
      fetchVerification();
    }
  }, [currentUser]);

  if (currentUser === "provider") {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
          <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
          <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ padding: 24, paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Welcome Back, Provider</Text>
                    {vStatus.verified && (
                      <View style={{ backgroundColor: COLORS.accent, borderRadius: 4, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: "900", color: "#fff" }}>VERIFIED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 4 }}>Your Dashboard</Text>
                </View>
                <TouchableOpacity onPress={() => onNavigate("profile")} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }}>
                  <Text style={{ fontSize: 24 }}>🔧</Text>
                </TouchableOpacity>
              </View>
          </LinearGradient>

            <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 16 }}>
              {/* Left Column: Work Status & Financial Ledger */}
              <View style={{ flex: isDesktop ? 2 : 1, gap: 16 }}>
                <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, elevation: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>Work Status</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: user?.is_available ? "#10B981" : "#9CA3AF", marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: user?.is_available ? "#10B981" : "#6B7280" }}>{user?.is_available ? "Available for Jobs" : "Busy / Offline"}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={async () => {
                      const newStatus = !user?.is_available;
                      onUpdateUser({ ...user, is_available: newStatus });
                      try {
                        await fetch(`${API_BASE}/auth/availability`, { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` }, body: JSON.stringify({ is_available: newStatus }) });
                      } catch (err) {
                        onUpdateUser({ ...user, is_available: !newStatus });
                        alert("Could not update status.");
                      }
                    }} style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: user?.is_available ? COLORS.primary : "#E5E7EB", padding: 2, justifyContent: "center" }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", transform: [{ translateX: user?.is_available ? 22 : 0 }], elevation: 2 }} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 16 }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.text }}>Trust Score</Text>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.primary }}>{vStatus.verified ? "98%" : "92%"}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}><View style={{ width: vStatus.verified ? "98%" : "92%", height: "100%", backgroundColor: COLORS.primary }} /></View>
                </View>

                <ProviderFinancialDashboard user={user} />
              </View>

              {/* Right Column: Vouching & Tools */}
              <View style={{ flex: isDesktop ? 1 : 1, gap: 16 }}>
                {!vStatus.verified && vStatus.vouch_status !== "pending" && (
                  <ProviderVouchingForm user={user} onVouchSubmitted={fetchVerification} />
                )}
                {vStatus.vouch_status === "pending" && (
                  <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: COLORS.primary }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.primary }}>⏳ Verification Pending</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: "center" }}>Your community gatekeeper request is being reviewed by the Wantok team.</Text>
                  </View>
                )}

                <View style={{ backgroundColor: "#1E293B", borderRadius: 20, padding: 20 }}>
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 }}>Quick Actions</Text>
                  <TouchableOpacity onPress={() => setIsUpdateModalVisible(true)} style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 10, marginBottom: 10 }}>
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Update Trade Skills</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 10 }}>
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>View Marketplace</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
        {/* Provider Profile Update Modal */}
        <Modal visible={isUpdateModalVisible} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 24, maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>Update Trade Profile</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Refine your skills for better job matching</Text>

                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>PRIMARY TRADE CATEGORY</Text>
                <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 16, paddingHorizontal: 12 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.label}
                        onPress={() => setProfileForm({...profileForm, primary_skill: cat.label})}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                          backgroundColor: profileForm.primary_skill === cat.label ? COLORS.primary : '#fff',
                          borderWidth: 1, borderColor: COLORS.border
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: profileForm.primary_skill === cat.label ? '#fff' : COLORS.text }}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>SKILLS & SPECIALIZATIONS</Text>
                <TextInput
                  placeholder="e.g. Commercial wiring, Pipe repair"
                  value={profileForm.skills_specialization}
                  onChangeText={(t) => setProfileForm({...profileForm, skills_specialization: t})}
                  style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 14 }}
                />

                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>YEARS EXP.</Text>
                    <TextInput
                      keyboardType="numeric"
                      placeholder="5"
                      value={profileForm.years_experience}
                      onChangeText={(t) => setProfileForm({...profileForm, years_experience: t})}
                      style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 14 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>HOURLY RATE (K)</Text>
                    <TextInput
                      keyboardType="numeric"
                      placeholder="50.00"
                      value={profileForm.hourly_rate}
                      onChangeText={(t) => setProfileForm({...profileForm, hourly_rate: t})}
                      style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 14 }}
                    />
                  </View>
                </View>

                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>OPERATING PROVINCE</Text>
                <TextInput
                  placeholder="e.g. National Capital District"
                  value={profileForm.operating_location}
                  onChangeText={(t) => setProfileForm({...profileForm, operating_location: t})}
                  style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginBottom: 24, fontSize: 14 }}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setIsUpdateModalVisible(false)}
                    style={{ flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', color: COLORS.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpdateProfile}
                    disabled={isUpdating}
                    style={{ flex: 2, padding: 16, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', color: '#fff' }}>{isUpdating ? 'Saving...' : 'Update Skills'}</Text>
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Good morning 👋</Text>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 2 }}>Find a Wantok</Text>
              </View>
              <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }} onPress={() => onNavigate("profile")}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: "#fff", borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, elevation: 4 }}>
              <Text style={{ fontSize: 18 }}>🔍</Text>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search trade or category..."
                placeholderTextColor={COLORS.textLight}
                style={{ flex: 1, fontSize: 14, color: COLORS.text, padding: 0 }}
                onSubmitEditing={fetchNearbyProviders}
              />
              <TouchableOpacity
                onPress={fetchNearbyProviders}
                style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Search</Text>
              </TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </LinearGradient>


        <ResponsiveContainer>
          <View style={{ paddingVertical: 20 }}>
            {isSearching ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>Searching for nearby providers...</Text>
              </View>
            ) : nearbyWorkers.length > 0 ? (
              <>
                <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 }}>Search Results</Text>
                <View style={{ backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border }}>
                  <View style={{ flexDirection: "row", backgroundColor: "#F9FAFB", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                    <Text style={{ flex: 2, fontWeight: "700", fontSize: 12, color: COLORS.textMuted }}>NAME</Text>
                    <Text style={{ flex: 2, fontWeight: "700", fontSize: 12, color: COLORS.textMuted }}>ROLE</Text>
                    <Text style={{ flex: 2, fontWeight: "700", fontSize: 12, color: COLORS.textMuted }}>LOCATION</Text>
                    <Text style={{ flex: 1, fontWeight: "700", fontSize: 12, color: COLORS.textMuted, textAlign: "right" }}>RATE</Text>
                  </View>
                  {nearbyWorkers.map((worker, index) => (
                    <TouchableOpacity
                      key={worker.id}
                      onPress={() => onNavigate("workerDetail", worker)}
                      style={{
                        flexDirection: "row",
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderBottomWidth: index === nearbyWorkers.length - 1 ? 0 : 1,
                        borderBottomColor: COLORS.border,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ flex: 2, fontSize: 13, fontWeight: "600", color: COLORS.text }}>{worker.name}</Text>
                      <Text style={{ flex: 2, fontSize: 13, color: COLORS.textMuted }}>{worker.trade || "Provider"}</Text>
                      <Text style={{ flex: 2, fontSize: 12, color: COLORS.textMuted }}>{worker.operating_location || "N/A"}</Text>
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.primary, textAlign: "right" }}>K{worker.hourly_rate || "0"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (searchText || selectedCategory) ? (
              <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' }}>
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
  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}

function ProviderNavigationShell({ renderScreen, navigate, activeNav, onboardingComplete }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      {onboardingComplete && (
        <View
          style={{
            backgroundColor: "#fff",
            height: Platform.OS === "ios" ? 84 : 68,
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: Platform.OS === "ios" ? 20 : 4,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => navigate(item.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: isActive ? "#F0FDF4" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? "800" : "500",
                    color: isActive ? COLORS.primary : COLORS.textMuted,
                  }}
                >
                  {item.label}
                </Text>
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
            backgroundColor: "#fff",
            height: Platform.OS === "ios" ? 84 : 68,
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: Platform.OS === "ios" ? 20 : 4,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => navigate(item.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: isActive ? "#F0FDF4" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? "800" : "500",
                    color: isActive ? COLORS.primary : COLORS.textMuted,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function TrustScreen({ onNavigate }) {
  const [workers] = useState([]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={{
            paddingVertical: 20,
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Trust & Verification
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4, fontSize: 13 }}>
            Admin Dashboard · All Workers
          </Text>
        </LinearGradient>

        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 }}>
            {[
              { label: "Verified Workers", value: "4", icon: "✅", color: "#10B981" },
              { label: "Pending Review", value: "2", icon: "⏳", color: "#F59E0B" },
              { label: "Total Reviews", value: "690", icon: "⭐", color: "#3B82F6" },
              { label: "Avg Trust Score", value: "87%", icon: "🛡️", color: "#8B5CF6" },
            ].map((stat, i) => (
              <View
                key={i}
                style={{
                  width: (width - 32) / 2 - 10,
                  margin: 5,
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</Text>
                <Text
                  style={{ fontWeight: "800", fontSize: 22, color: stat.color }}
                >
                  {stat.value}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: COLORS.textMuted }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BookingsScreen({ onNavigate, user, currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/list`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
    } catch (e) {
      console.error("Fetch bookings failed", e);
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
        alert(data.message || "Action successful");
        fetchBookings();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e) {
      alert("Error performing action: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBookings} />} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
        <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ paddingVertical: 20, paddingHorizontal: 16, paddingBottom: 24 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>My Bookings</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4, fontSize: 13 }}>Work History & Financial Milestones</Text>
        </LinearGradient>

        <View style={{ padding: 16, gap: 12 }}>
          {bookings.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center' }}>No bookings found.</Text>
            </View>
          ) : bookings.map((b) => {
            const isCustomer = currentUser === 'customer';
            const isProvider = currentUser === 'provider';

            return (
              <View key={b.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: COLORS.text }}>{b.service_type}</Text>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: COLORS.primary }}>K{b.price}</Text>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{isCustomer ? `Provider: ${b.provider_name || 'Unassigned'}` : `Customer: ${b.customer_name}`}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>Status: {b.status.toUpperCase()}</Text>
                </View>

                {/* Actions based on State Machine */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {b.status === 'pending' && isProvider && (
                    <TouchableOpacity onPress={() => handleAction(b.id, 'accept')} style={{ backgroundColor: COLORS.primary, padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Accept Job</Text>
                    </TouchableOpacity>
                  )}
                  {b.status === 'accepted' && isCustomer && (
                    <TouchableOpacity onPress={() => handleAction(b.id, 'escrow')} style={{ backgroundColor: '#1E293B', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm & Pay (Escrow)</Text>
                    </TouchableOpacity>
                  )}
                  {b.status === 'in_progress' && isProvider && (
                    <TouchableOpacity onPress={() => handleAction(b.id, 'complete')} style={{ backgroundColor: COLORS.secondary, padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Mark as Completed</Text>
                    </TouchableOpacity>
                  )}
                  {b.status === 'completed_awaiting_approval' && isCustomer && (
                    <TouchableOpacity onPress={() => handleAction(b.id, 'approve')} style={{ backgroundColor: '#059669', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Approve & Release Funds</Text>
                    </TouchableOpacity>
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

function RoleSelectionScreen({ onSelectRole }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.primary, textAlign: "center", marginBottom: 12 }}>
        Choose Your Role
      </Text>
      <Text style={{ fontSize: 16, color: COLORS.textMuted, textAlign: "center", marginBottom: 40, paddingHorizontal: 20 }}>
        How would you like to use the Wantok Workforce platform today?
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={() => onSelectRole("customer")}
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 20,
            alignItems: "center",
            borderWidth: 2,
            borderColor: COLORS.border,
            elevation: 4,
          }}
        >
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>🤝</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
            Become a Customer
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", lineHeight: 16 }}>
            I want to find and hire trusted local professionals in Port Moresby.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectRole("provider")}
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 20,
            alignItems: "center",
            borderWidth: 2,
            borderColor: COLORS.border,
            elevation: 4,
          }}
        >
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>🔧</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
            Become a Service Provider
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", lineHeight: 16 }}>
            I want to list my trade, grow my business, and find local jobs.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProviderOnboardingScreen({ onComplete, user }) {
  const [trade, setTrade] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!trade || !city) {
      alert("Please fill in both fields.");
      return;
    }
    setLoading(true);
    let data;
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          primary_skill: trade,
          location_name: city
        })
      });

      data = await response.json().catch(() => ({ error: 'Invalid response from server' }));
      if (response.ok) {
        onComplete({ primary_skill: trade, location_name: city });
      } else {
        alert(data.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Trade profile update error:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 8, marginTop: 40 }}>
        Complete Your Trade Profile
      </Text>
      <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 32 }}>
        Tell us a bit more about your services to get started.
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
          Trade Type
        </Text>
        <TextInput
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
          }}
          placeholder="e.g. Electrician, Plumber, Tailor"
          value={trade}
          onChangeText={setTrade}
        />
      </View>

      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
          City Location
        </Text>
        <TextInput
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
          }}
          placeholder="e.g. Port Moresby, Lae"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <TouchableOpacity
        onPress={handleComplete}
        disabled={!trade || !city || loading}
        style={{
          backgroundColor: (!trade || !city || loading) ? COLORS.textLight : COLORS.primary,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
          {loading ? "SAVING..." : "Complete Profile"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AuthScreen({ onAuth }) {
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");

  useEffect(() => {
    const checkDB = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      try {
        const apiRes = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        if (apiRes.ok) {
          const dbRes = await fetch(`${API_BASE}/health/db`, { signal: controller.signal });
          if (dbRes.ok) setDbStatus("connected");
          else setDbStatus("online (db issues)");
        } else {
          setDbStatus("error");
        }
      } catch (e) {
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      alert("Please enter both identifier (Phone/Email) and password.");
      return;
    }
    if (loading) return;
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

      if (response.ok) {
        onAuth({ ...data.user, token: data.token, active_persona: (data.user.roles && data.user.roles.includes('admin')) ? 'admin' : data.user.role }, false);
      } else {
        alert(data.error || "Signin failed");
      }
    } catch (error) {
      alert("Network Error: " + error.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSignUpNext = async () => {
    if (signUpStep === 1) {
      if (!name || !email) {
        alert("Please provide your full name and email address.");
        return;
      }
      setSignUpStep(2);
    } else {
      if (!phone || !password) {
        alert("Please provide your phone number and create a password.");
        return;
      }
      if (loading) return;
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });

        const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

        if (response.ok) {
          onAuth({ ...data.user, token: data.token, active_persona: data.user.role }, true);
        } else {
          alert(data.error || "Signup failed");
        }
      } catch (error) {
        alert("Network Error: " + error.message);
      } finally {
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
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }}
        />
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
          WANTOK WORKFORCE
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dbStatus === "connected" ? "#4ADE80" : "#EF4444", marginRight: 6 }} />
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
            System Status: {dbStatus}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 4, maxWidth: 450, width: "100%", alignSelf: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 8 }}>
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24 }}>
            {mode === "signin"
              ? "Sign in to continue your journey"
              : `Step ${signUpStep} of 2`}
          </Text>

          {mode === "signin" ? (
            <>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>Phone/Email</Text>
                <TextInput
                  style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12 }}
                  placeholder="0000 0000 or email@example.com"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>Password</Text>
                <TextInput
                  style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12 }}
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
              <TouchableOpacity onPress={handleSignIn} style={{ backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "Signing In..." : "Sign In"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {signUpStep === 1 ? (
                <>
                  <TextInput style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16 }} placeholder="Full Name" value={name} onChangeText={setName} />
                  <TextInput style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 24 }} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                </>
              ) : (
                <>
                  <TextInput style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16 }} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  <TextInput style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 24 }} placeholder="Create Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                </>
              )}
              <TouchableOpacity onPress={handleSignUpNext} style={{ backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "Processing..." : (signUpStep === 1 ? "Next Step" : "Create Account")}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => setMode(mode === "signin" ? "signup" : "signin")} style={{ alignItems: "center" }}>
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
              {mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function AdminAuthScreen({ onAuth }) {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async () => {
    if (!identifier || !password) {
      alert("Please enter admin credentials.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (response.ok && data.user.roles?.includes('admin')) {
        onAuth({ ...data.user, token: data.token, active_persona: 'admin' }, false);
      } else {
        alert(data.error || "Access Denied");
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A", justifyContent: "center", padding: 24 }}>
      <View style={{ maxWidth: 450, width: "100%", alignSelf: "center" }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 40 }}>ADMIN PORTAL</Text>
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 24 }}>
          <TextInput style={{ backgroundColor: "#0F172A", color: "#fff", borderRadius: 8, padding: 12, marginBottom: 16 }} placeholder="Admin Identifier" placeholderTextColor="#475569" value={identifier} onChangeText={setIdentifier} />
          <TextInput style={{ backgroundColor: "#0F172A", color: "#fff", borderRadius: 8, padding: 12, marginBottom: 24 }} placeholder="Security Key" placeholderTextColor="#475569" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={handleAdminLogin} style={{ backgroundColor: "#3B82F6", padding: 16, borderRadius: 8, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "AUTHORIZING..." : "AUTHORIZE ACCESS"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function WorkerDetailScreen({ worker, onNavigate }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView>
        <View style={{ padding: 20, alignItems: "center" }}>
          <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={{ width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800" }}>{worker?.name?.charAt(0) || "W"}</Text>
          </LinearGradient>
          <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.text }}>{worker?.name}</Text>
          <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: "600", marginTop: 4 }}>{worker?.primary_skill}</Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8, color: COLORS.text }}>About</Text>
          <Text style={{ color: COLORS.textMuted, lineHeight: 20 }}>{worker?.bio || "No professional bio provided yet."}</Text>
          <TouchableOpacity onPress={() => onNavigate("createBooking", worker)} style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 30 }}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>Book Now</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate("home")} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: COLORS.textMuted }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function CreateBookingScreen({ worker, onNavigate, user }) {
  const [loading, setLoading] = useState(false);
  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` },
        body: JSON.stringify({ service_type: worker?.primary_skill || "General Service", price: worker?.hourly_rate || 50.00, scheduled_at: new Date().toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        alert("Booking Request Sent!");
        onNavigate("booking");
      } else {
        alert(data.error || "Failed");
      }
    } catch (e) {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 30 }}>Book {worker?.name}</Text>
      <TouchableOpacity onPress={handleBooking} disabled={loading} style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "Sending..." : "Confirm Booking"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileScreen({ onNavigate, currentUser, onLogout, user }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ alignItems: "center" }}>
        <ResponsiveContainer>
          <View style={{ padding: 24, alignItems: "center" }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800" }}>{user?.name?.charAt(0)}</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "800" }}>{user?.name}</Text>
            <Text style={{ color: COLORS.textMuted }}>{user?.email}</Text>
            <TouchableOpacity onPress={onLogout} style={{ marginTop: 40, padding: 16, backgroundColor: "#fff", borderRadius: 12, width: "100%", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: COLORS.danger }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

function AdminScreen({ onNavigate, onLogout, user }) {
  const [stats, setStats] = useState({ totalCustomers: 0, totalProviders: 0, totalMatches: 0 });
  const [activeTab, setActiveTab] = useState("dashboard");
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard-metrics`, { headers: { "Authorization": `Bearer ${user?.token}` } });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) {}
  };
  useEffect(() => { fetchStats(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ backgroundColor: "#1E293B", padding: 20, paddingTop: 50 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>Admin Dashboard</Text>
      </View>
      <ScrollView style={{ padding: 16 }}>
        <ResponsiveContainer>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: "#64748B" }}>CUSTOMERS</Text>
              <Text style={{ fontSize: 20, fontWeight: "900" }}>{stats.totalCustomers}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: "#64748B" }}>PROVIDERS</Text>
              <Text style={{ fontSize: 20, fontWeight: "900" }}>{stats.totalProviders}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onLogout} style={{ padding: 16, backgroundColor: "#fff", borderRadius: 12, alignItems: "center" }}>
            <Text style={{ fontWeight: "700", color: COLORS.danger }}>Sign Out</Text>
          </TouchableOpacity>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [screenData, setScreenData] = useState(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        const savedUser = localStorage.getItem('wantok_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          handleAuth(parsed, false);
        }
      } catch (e) {}
    }
  }, []);

  const handleAuth = (userData, isSignUp = false) => {
    setUser(userData);
    setIsAuthenticated(true);
    if (Platform.OS === 'web') localStorage.setItem('wantok_user', JSON.stringify(userData));

    const persona = userData.active_persona || (userData.roles && userData.roles[0]) || 'customer';
    setCurrentUser(persona);
    if (persona === 'provider' && (!userData.primary_skill || !userData.location_name)) {
      setOnboardingComplete(false);
    } else {
      setOnboardingComplete(true);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') localStorage.removeItem('wantok_user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentUser(null);
    setScreen("home");
  };

  const navigate = (to, data = null) => {
    setScreen(to);
    setScreenData(data);
  };

  const renderScreen = () => {
    if (!isAuthenticated) return <AuthScreen onAuth={handleAuth} />;
    if (!currentUser) return <RoleSelectionScreen onSelectRole={setCurrentUser} />;
    if (currentUser === "provider" && !onboardingComplete) return <ProviderOnboardingScreen user={user} onComplete={details => { setUser({...user, ...details}); setOnboardingComplete(true); }} />;

    switch (screen) {
      case "home": return <HomeScreen onNavigate={navigate} currentUser={currentUser} user={user} onUpdateUser={setUser} />;
      case "booking": return <BookingsScreen onNavigate={navigate} user={user} currentUser={currentUser} />;
      case "trust": return <TrustScreen onNavigate={navigate} />;
      case "profile": return <ProfileScreen onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} user={user} />;
      case "workerDetail": return <WorkerDetailScreen worker={screenData} onNavigate={navigate} />;
      case "createBooking": return <CreateBookingScreen worker={screenData} onNavigate={navigate} user={user} />;
      case "admin": return <AdminScreen onNavigate={navigate} onLogout={handleLogout} user={user} />;
      default: return <HomeScreen onNavigate={navigate} currentUser={currentUser} user={user} onUpdateUser={setUser} />;
    }
  };

  const activeNav = screen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.statusBar }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.statusBar} />
      <View style={{ flex: 1, width: "100%" }}>
        <View style={{ backgroundColor: COLORS.statusBar, height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 }}>
          <Image source={require("./assets/brand_logo.jpg")} style={{ width: 32, height: 32, borderRadius: 16 }} />
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>WANTOK WORKFORCE</Text>
        </View>

        {!isAuthenticated || !currentUser ? (
          <View style={{ flex: 1, backgroundColor: COLORS.bg }}>{renderScreen()}</View>
        ) : currentUser === 'admin' ? (
          <AdminNavigationShell renderScreen={renderScreen} />
        ) : currentUser === 'provider' ? (
          <ProviderNavigationShell renderScreen={renderScreen} navigate={navigate} activeNav={activeNav} onboardingComplete={onboardingComplete} />
        ) : (
          <CustomerNavigationShell renderScreen={renderScreen} navigate={navigate} activeNav={activeNav} onboardingComplete={onboardingComplete} />
        )}
      </View>
    </SafeAreaView>
  );
}

function WorkerCard({ worker, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: "#fff", borderRadius: 18, padding: 16, flexDirection: "row", gap: 14 }}>
      <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{worker?.name?.charAt(0)}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700" }}>{worker?.name}</Text>
        <Text style={{ color: COLORS.primary, fontSize: 13 }}>{worker?.primary_skill}</Text>
        <StarRating rating={4.8} />
      </View>
    </TouchableOpacity>
  );
}
