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
  <View style={{ width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", paddingHorizontal: CONTENT_PADDING }}>
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
          {ledger?.history?.map((job) => (
            <View key={job?.id || Math.random()} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2, borderLeftWidth: 6, borderLeftColor: COLORS.primary }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>{job?.service_type}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Client: {job?.customer_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.primary }}>K{Number(job?.price).toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.textLight, textAlign: 'right' }}>{new Date(job?.completed_at || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 12 }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>⭐</Text>
                  <Text style={{ fontWeight: "700", color: COLORS.accent }}>{job?.feedback_rating || 5.0} Rating</Text>
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
          setNearbyWorkers(workers);
        } else {
          // Implement lightweight, scoring-based fuzzy matching loop
          const fuzzyResults = workers.filter(worker => {
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
                for (let i = 0; i < Math.min(word.length, targetWord.length); i++) {
                  if (word[i] !== targetWord[i]) distance++;
                }
                return distance <= 1 && Math.abs(word.length - targetWord.length) <= 1;
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
          <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ padding: 24, paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Welcome Back, Provider</Text>
                    {vStatus?.verified && (
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
                    <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.primary }}>{vStatus?.verified ? "98%" : "92%"}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}><View style={{ width: vStatus?.verified ? "98%" : "92%", height: "100%", backgroundColor: COLORS.primary }} /></View>
                </View>

                <ProviderFinancialDashboard user={user} />
              </View>

              <View style={{ flex: isDesktop ? 1 : 1, gap: 16 }}>
                {!vStatus?.verified && vStatus?.vouch_status !== "pending" && (
                  <ProviderVouchingForm user={user} onVouchSubmitted={fetchVerification} />
                )}
                {vStatus?.vouch_status === "pending" && (
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
        <Modal visible={isUpdateModalVisible} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 24, maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>Update Trade Profile</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Refine your skills for better job matching</Text>

                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>PRIMARY TRADE CATEGORY</Text>
                <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 16, paddingHorizontal: 12 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
                    {categories?.map((cat) => (
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
              <TextInput value={searchText} onChangeText={setSearchText} placeholder="Search trade or category..." placeholderTextColor={COLORS.textLight} style={{ flex: 1, fontSize: 14, color: COLORS.text, padding: 0 }} onSubmitEditing={fetchNearbyProviders} />
              <TouchableOpacity onPress={fetchNearbyProviders} style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 }}><Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Search</Text></TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </LinearGradient>

        <ResponsiveContainer>
          <View style={{ paddingVertical: 20 }}>
            {isSearching ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>Searching for nearby providers...</Text>
              </View>
            ) : nearbyWorkers?.length > 0 ? (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 4 }}>Search Results</Text>
                {nearbyWorkers?.map((worker) => (
                  <WorkerCard key={worker?.id || Math.random()} worker={worker} onPress={() => onNavigate("workerDetail", worker)} />
                ))}
              </View>
            ) : (searchText) ? (
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
            backgroundColor: "#fff",
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
                  gap: 3,
                  paddingVertical: 4,
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isActive ? "#F0FDF4" : "transparent", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 20 }}>{item?.icon}</Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: isActive ? "800" : "500", color: isActive ? COLORS.primary : COLORS.textMuted }}>{item?.label}</Text>
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
                  <Text style={{ fontSize: 20 }}>{item?.icon}</Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? "800" : "500",
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

function TrustScreen({ onNavigate }) {
  const [workers] = useState(
    [].map((w) => ({ ...w, trustScore: Math.floor(70 + Math.random() * 30) }))
  );

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
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
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

          <Text
            style={{ marginTop: 8, marginBottom: 4, fontSize: 15, fontWeight: "700", color: COLORS.text }}
          >
            Worker Trust Scores
          </Text>

          {workers?.map((w) => (
            <View
              key={w.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                elevation: 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <LinearGradient
                colors={
                  w.type === "blue" ? ["#60A5FA", "#2563EB"] : ["#A78BFA", "#7C3AED"]
                }
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                  {w.avatar}
                </Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: COLORS.text }}>
                    {w.name}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 13,
                      color: w.trustScore > 85 ? "#10B981" : "#F59E0B",
                    }}
                  >
                    {w.trustScore}%
                  </Text>
                </View>
                <Text style={{ marginVertical: 2, fontSize: 12, color: COLORS.textMuted }}>
                  {w.role}
                </Text>
                <View style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 3 }}>
                  <View
                    style={{
                      width: `${w.trustScore}%`,
                      height: "100%",
                      borderRadius: 3,
                      backgroundColor: w.trustScore > 85 ? "#10B981" : "#F59E0B",
                    }}
                  />
                </View>
              </View>
              {w.verified && <Text style={{ fontSize: 18 }}>✅</Text>}
            </View>
          ))}
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
          {(!bookings || bookings.length === 0) ? (
            <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center' }}>No bookings found.</Text>
            </View>
          ) : bookings?.map((b, idx) => {
            const isCustomer = currentUser === 'customer';
            const isProvider = currentUser === 'provider';

            return (
              <View key={b?.id || idx} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: COLORS.text }}>{b?.service_type}</Text>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: COLORS.primary }}>K{b?.price}</Text>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{isCustomer ? `Provider: ${b?.provider_name || 'Unassigned'}` : `Customer: ${b?.customer_name}`}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>Status: {(b?.status || "").toUpperCase()}</Text>
                </View>

                {/* Actions based on State Machine */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {b?.status === 'pending' && isProvider && (
                    <TouchableOpacity onPress={() => handleAction(b?.id, 'accept')} style={{ backgroundColor: COLORS.primary, padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Accept Job</Text>
                    </TouchableOpacity>
                  )}
                  {b?.status === 'accepted' && isCustomer && (
                    <TouchableOpacity onPress={() => handleAction(b?.id, 'escrow')} style={{ backgroundColor: '#1E293B', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm & Pay (Escrow)</Text>
                    </TouchableOpacity>
                  )}
                  {b?.status === 'in_progress' && isProvider && (
                    <TouchableOpacity onPress={() => handleAction(b?.id, 'complete')} style={{ backgroundColor: COLORS.secondary, padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Mark as Completed</Text>
                    </TouchableOpacity>
                  )}
                  {b?.status === 'completed_awaiting_approval' && isCustomer && (
                    <TouchableOpacity onPress={() => handleAction(b?.id, 'approve')} style={{ backgroundColor: '#059669', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}>
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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
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
  const [showPassword, setShowPassword] = useState(true);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      alert("Please enter both identifier (Phone/Email) and password.");
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
        alert("Network Status: " + response.status + "\nDetails: " + (data.details || data.error || "Signin failed"));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        alert('Server connection timeout. Please check backend logs.');
      } else {
        console.error("🚨 Full Network Error (SignIn):", error);
        alert("Network Status: OFFLINE\nDetails: " + (data?.message || data?.error || error.message || "Please verify your credentials or check connection."));
      }
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
      if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
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
          alert("Network Status: " + response.status + "\nDetails: " + (data.details || data.error || "Signup failed"));
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          alert('Server connection timeout. Please check backend logs.');
        } else {
          console.error("🚨 Full Network Error (SignUp):", error);
          alert("Network Status: OFFLINE\nDetails: " + (data?.message || data?.error || error.message || "Please verify your credentials or check connection."));
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
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }}
        />
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
          WANTOK WORKFORCE
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dbStatus === "connected" ? "#4ADE80" : (dbStatus === "checking" ? "#FBBF24" : "#EF4444"), marginRight: 6 }} />
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
            System Status: {dbStatus}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, maxWidth: 450, width: "100%", alignSelf: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 8 }}>
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24 }}>
            {mode === "signin"
              ? "Sign in to continue your journey"
              : `Step ${signUpStep} of 2: ${signUpStep === 1 ? "Basic Info" : "Security"}`}
          </Text>

          {mode === "signin" ? (
            <>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
                  Phone Number or Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                  }}
                  placeholder="0000 0000 or email@example.com"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 10,
                      padding: 12,
                      paddingRight: 50,
                      fontSize: 14,
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
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
                      {showPassword ? "HIDE" : "SHOW"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSignIn}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>{loading ? "Signing In..." : "Sign In"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {signUpStep === 1 ? (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
                      Full Name
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 14,
                      }}
                      placeholder="e.g. John Smith"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
                      Email Address
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 14,
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
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
                      Phone Number
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 14,
                      }}
                      placeholder="e.g. 7000 1234"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>
                      Create Password
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        style={{
                          backgroundColor: "#fff",
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          borderRadius: 10,
                          padding: 12,
                          paddingRight: 50,
                          fontSize: 14,
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
                        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
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
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                  {loading ? "Creating Account..." : (signUpStep === 1 ? "Next Step" : "Create Account")}
                </Text>
              </TouchableOpacity>
              {signUpStep === 2 && (
                <TouchableOpacity onPress={() => setSignUpStep(1)} style={{ alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Back to Basic Info</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setSignUpStep(1);
            }}>
              <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 14 }}>
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
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
          alert("Access Denied: Administrative privileges required.");
          if (Platform.OS === 'web') window.location.href = '/';
        }
      } else {
        alert("Network Status: " + response.status + "\nDetails: " + (data.error || "Login failed"));
      }
    } catch (error) {
      console.error("🚨 Full Network Error (AdminLogin):", error);
      alert("Network Status: OFFLINE\nDetails: " + (data?.message || data?.error || error.message || "Unknown network error."));
    } finally {
      setLoading(false);
    }
  };

    return (
      <View style={{ flex: 1, backgroundColor: "#0F172A", justifyContent: "center", padding: 24 }}>
        <View style={{ maxWidth: 450, width: "100%", alignSelf: "center" }}>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#334155", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 32 }}>🔐</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 1 }}>
              ADMIN PORTAL
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 8 }}>
              Wantok Workforce Back-Office
            </Text>
          </View>

          <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 24, elevation: 8 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" }}>
                Admin Identifier
              </Text>
              <TextInput
                style={{ backgroundColor: "#0F172A", color: "#fff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#334155" }}
                placeholder="Username or Email"
                placeholderTextColor="#475569"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" }}>
                Security Key
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={{ backgroundColor: "#0F172A", color: "#fff", borderRadius: 8, padding: 12, paddingRight: 48, borderWidth: 1, borderColor: "#334155" }}
                  placeholder="Enter password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: 12 }}
                >
                  <Text style={{ fontSize: 18 }}>{showPassword ? "👁️" : "🔒"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAdminLogin}
              disabled={loading}
              style={{
                backgroundColor: "#3B82F6",
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
                opacity: loading ? 0.7 : 1
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                {loading ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => { if (Platform.OS === "web") window.location.href = "/"; }}
            style={{ marginTop: 24, alignItems: "center" }}
          >
            <Text style={{ color: "#475569", fontSize: 13 }}>Return to Public Site</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}
function WorkerDetailScreen({ worker, onNavigate }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      <ScrollView>
        <View style={{ padding: 20, alignItems: "center" }}>
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            style={{ width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 16 }}
          >
            <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800" }}>{worker?.name?.charAt(0) || "W"}</Text>
          </LinearGradient>
          <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.text }}>{worker?.name}</Text>
          <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: "600", marginTop: 4 }}>{worker?.primary_skill}</Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8, color: COLORS.text }}>About</Text>
          <Text style={{ color: COLORS.textMuted, lineHeight: 20 }}>{worker?.bio || "No professional bio provided yet."}</Text>
          <TouchableOpacity
            onPress={() => onNavigate("createBooking", worker)}
            style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 30 }}
          >
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
        alert("Booking Request Sent!");
        onNavigate("booking");
      } else {
        alert(data.error || "Failed to create booking");
      }
    } catch (e) {
      alert("Error creating booking: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 10, color: COLORS.text }}>Book {worker?.name}</Text>
      <Text style={{ textAlign: "center", color: COLORS.textMuted, marginBottom: 10 }}>Service: {worker?.primary_skill}</Text>
      <Text style={{ textAlign: "center", color: COLORS.primary, fontWeight: '700', fontSize: 18, marginBottom: 30 }}>K{worker?.hourly_rate}/hr</Text>

      <TouchableOpacity
        onPress={handleBooking}
        disabled={loading}
        style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center", opacity: loading ? 0.6 : 1 }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "Sending..." : "Confirm Booking"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate("home")} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: COLORS.textMuted }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileScreen({ onNavigate, currentUser, onLogout, user, onUpdateUser }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      <ScrollView contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
        <View style={{ padding: 24, alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
           <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
             <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800" }}>{user?.name?.charAt(0) || "U"}</Text>
           </View>
           <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text }}>{user?.name}</Text>
           <Text style={{ color: COLORS.textMuted }}>{user?.email}</Text>
           <View style={{ backgroundColor: COLORS.primary + "15", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 }}>
             <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 12 }}>{currentUser?.toUpperCase()}</Text>
           </View>
        </View>

        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={onLogout} style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", borderRadius: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>🚪</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.danger }}>Logout</Text>
          </TouchableOpacity>
          {user?.roles?.includes("admin") && (
            <TouchableOpacity onPress={() => onNavigate("admin")} style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", borderRadius: 12 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🛠️</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>Admin Dashboard</Text>
            </TouchableOpacity>
          )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function AdminScreen({ onNavigate, onLogout, user }) {
  const { width: screenWidth } = Dimensions.get("window");
  const isDesktop = screenWidth > 1024;
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
  const [logs, setLogs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [systemSettings, setSystemSettings] = useState({ match_radius: 50, platform_fee: 10, maintenance_mode: false });

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
      const res = await fetch(`${API_BASE}/admin/users?role=${encodeURIComponent(roleFilter)}`, {
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
        alert("🔄 Database Reconciliation Complete");
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
      else if (action === 'update_settings') {
        const key = Object.keys(data)[0];
        res = await fetch(`${API_BASE}/admin/settings`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify({ key, value: data[key] }) });
      } else if (action === "release_payout") res = await fetch(`${API_BASE}/admin/release-payout/${userId}`, { method: "POST", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === "refund_escrow") res = await fetch(`${API_BASE}/admin/refund-escrow/${userId}`, { method: "POST", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === 'queue_override') res = await fetch(`${API_BASE}/admin/queue/override`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(data) });

      if (res && res.ok) {
        if (activeTab === "users") fetchUsers();
        if (activeTab === "verification") { fetchPending(); fetchQueue(); }
        if (activeTab === "dashboard") fetchStats();
        setModalVisible(false);
      } else { alert("Action failed"); }
    } catch (e) { alert("Error connecting to server"); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ backgroundColor: "#1E293B" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", alignSelf: "center", padding: 20, paddingTop: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>Wantok Admin</Text>
            <Text style={{ fontSize: 12, color: "#94A3B8" }}>SaaS Control Portal</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={{ backgroundColor: "#334155", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
            <Text style={{ color: "#F1F5F9", fontWeight: "700", fontSize: 12 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", alignSelf: "center", flexDirection: "row" }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "users", label: "Users", icon: "👥" },
            { id: "verification", label: "Queue", icon: "⏳" },
            { id: "logs", label: "Logs", icon: "📜" },
            { id: "settings", label: "Controls", icon: "🎛️" },
          ].map((tab) => (
            <TouchableOpacity key={tab?.id} onPress={() => setActiveTab(tab.id)} style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3, borderBottomColor: activeTab === tab.id ? COLORS.primary : "transparent" }}>
              <Text style={{ fontSize: 16, marginBottom: 2 }}>{tab.icon}</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: activeTab === tab.id ? COLORS.primary : "#64748B" }}>{tab.label.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ maxWidth: MAX_WIDTH, width: "100%", paddingHorizontal: CONTENT_PADDING }}>
          {activeTab === "dashboard" && (
            <View style={{ padding: 16, gap: 16 }}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 12 }}>
                {[
                  { label: "TOTAL CUSTOMERS", val: stats?.totalCustomers || 0, color: "#3B82F6" },
                  { label: "TOTAL PROVIDERS", val: stats?.totalProviders || 0, color: "#F59E0B" },
                  { label: "COMPLETED MATCHES", val: stats?.totalMatches || 0, color: "#10B981" },
                  { label: "ESCROW CAPITAL", val: `K${parseFloat(ledgerStats?.totalEscrowCapital || 0).toFixed(2)}`, color: "#8B5CF6" },
                  { label: "PLATFORM REVENUE", val: `K${parseFloat(ledgerStats?.totalRevenue || 0).toFixed(2)}`, color: "#EC4899" }
                ].map((m, idx) => (
                  <View key={idx} style={{ flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: m.color, elevation: 2 }}>
                    <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "800" }}>{m.label}</Text>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#1E293B", marginTop: 4 }}>{m.val}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 16 }}>
                <View style={{ flex: isDesktop ? 2 : 1, gap: 16 }}>
                  <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 16 }}>🚨 Critical Disputes (Milestone Arbitration)</Text>
                    {disputedJobs?.length === 0 ? (
                      <Text style={{ color: "#64748B", fontSize: 13, fontStyle: "italic" }}>No active disputes requiring intervention.</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View>
                          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingBottom: 8, marginBottom: 8 }}>
                            <Text style={{ width: 150, fontWeight: "700", fontSize: 12 }}>SERVICE</Text>
                            <Text style={{ width: 120, fontWeight: "700", fontSize: 12 }}>CUSTOMER</Text>
                            <Text style={{ width: 100, fontWeight: "700", fontSize: 12, textAlign: "right" }}>AMOUNT</Text>
                            <Text style={{ width: 150, fontWeight: "700", fontSize: 12, textAlign: "center" }}>ACTIONS</Text>
                          </View>
                          {disputedJobs?.map(job => (
                            <View key={job?.id || Math.random()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                              <Text style={{ width: 150, fontSize: 13 }}>{job?.service_type}</Text>
                              <Text style={{ width: 120, fontSize: 13, color: "#64748B" }}>{job?.customer_name}</Text>
                              <Text style={{ width: 100, fontSize: 13, fontWeight: "700", textAlign: "right" }}>K{job?.price}</Text>
                              <View style={{ width: 150, flexDirection: "row", justifyContent: "center", gap: 8 }}>
                                <TouchableOpacity onPress={() => handleUserAction(job.id, "release_payout")} style={{ backgroundColor: "#10B981", padding: 6, borderRadius: 4 }}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>RELEASE</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleUserAction(job.id, "refund_escrow")} style={{ backgroundColor: "#EF4444", padding: 6, borderRadius: 4 }}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>REFUND</Text></TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    )}
                  </View>
                  <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E293B" }}>👥 Recent User Activity</Text>
                      <TouchableOpacity onPress={() => setActiveTab("users")}><Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 12 }}>VIEW ALL →</Text></TouchableOpacity>
                    </View>
                    {users?.slice(0, 5)?.map(u => (
                      <View key={u?.id || Math.random()} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                        <View>
                          <Text style={{ fontWeight: "700", fontSize: 13 }}>{u?.name}</Text>
                          <Text style={{ fontSize: 11, color: "#64748B" }}>{u?.email}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <View style={{ backgroundColor: u?.role === "provider" ? "#DCFCE7" : "#DBEAFE", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color: u?.role === "provider" ? "#166534" : "#1E40AF" }}>{(u?.role || "").toUpperCase()}</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{new Date(u?.created_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flex: isDesktop ? 1 : 1, gap: 16 }}>
                  <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 20, elevation: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 12 }}>🛠️ Administrative Tools</Text>
                    <TouchableOpacity onPress={handleForceSync} style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 10, marginBottom: 10 }}><Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Database Force Reconciliation</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab("settings")} style={{ backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 }}><Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Global System Controls</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "users" && (
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", alignItems: isDesktop ? "center" : "flex-start", marginBottom: 20, gap: 12 }}>
                <View style={{ flex: 1, width: "100%" }}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B" }}>User Management</Text>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>Manage accounts across the platform</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10, width: isDesktop ? "auto" : "100%" }}>
                  <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#E2E8F0", flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text>🔍</Text>
                    <TextInput placeholder="Search name/email..." value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, fontSize: 14 }} />
                  </View>
                  <TouchableOpacity onPress={() => { setEditingUser({ name: '', email: '', phone_number: '', role: 'customer', roles: ['customer'], is_verified: false, is_flagged: false }); setModalVisible(true); }} style={{ backgroundColor: "#1E293B", paddingHorizontal: 16, justifyContent: "center", borderRadius: 8 }}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>+ ADD</Text></TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {["All Roles", "Service Providers", "Customers", "Admins"]?.map(f => (
                  <TouchableOpacity key={f} onPress={() => setRoleFilter(f)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: roleFilter === f ? COLORS.primary : "#E2E8F0", borderWidth: 1, borderColor: roleFilter === f ? COLORS.primary : "#CBD5E1" }}><Text style={{ fontSize: 11, fontWeight: "700", color: roleFilter === f ? "#fff" : "#475569" }}>{f.toUpperCase()}</Text></TouchableOpacity>
                ))}
              </View>
              {loading ? (
                <View style={{ padding: 40, alignItems: "center" }}><Text style={{ color: "#64748B", fontSize: 14 }}>Loading records...</Text></View>
              ) : users?.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}><Text style={{ color: "#64748B", fontSize: 14 }}>No users found.</Text></View>
              ) : users?.filter(u => {
                  const q = (searchQuery || "").toLowerCase();
                  return (u?.name || "").toLowerCase().includes(q) || (u?.email || "").toLowerCase().includes(q) || (u.phone_number || "").toLowerCase().includes(q);
                })?.map(u => (
                <View key={u?.id || Math.random()} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B" }}>{u?.name}</Text>
                        <Text style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(u?.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{u?.email} • {u.phone_number}</Text>
                      <Text style={{ fontSize: 12, color: "#1E293B", fontWeight: "600", marginBottom: 6 }}>Balance: K{parseFloat(u?.balance || 0).toFixed(2)} • Status: {u?.status || 'active'}</Text>
                      {u?.roles?.includes('provider') && u?.trade_type && (<Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "600", marginBottom: 6 }}>📍 {u?.city_location || 'PNG'} • {u?.trade_type}</Text>)}
                      <View style={{ flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {(Array.isArray(u?.roles) ? u?.roles : []).map(r => (
                          <View key={r} style={{ backgroundColor: r === 'provider' ? "#DCFCE7" : (r === 'customer' ? "#DBEAFE" : "#E2E8F0"), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: "800", color: r === 'provider' ? "#166534" : (r === 'customer' ? "#1E40AF" : "#475569") }}>{r.toUpperCase()}</Text></View>
                        ))}
                        {u.is_verified && <View style={{ backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#BBF7D0" }}><Text style={{ fontSize: 10, fontWeight: "800", color: "#15803D" }}>✅ VERIFIED</Text></View>}
                        {u.is_flagged && <View style={{ backgroundColor: "#FEF2F2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#FECDD3" }}><Text style={{ fontSize: 10, fontWeight: "800", color: "#B91C1C" }}>🚩 FLAGGED</Text></View>}
                        {u?.status === 'suspended' && <View style={{ backgroundColor: "#000", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: "800", color: "#fff" }}>⛔ SUSPENDED</Text></View>}
                      </View>
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                        <TouchableOpacity onPress={() => handleUserAction(u?.id, 'update', { role: u?.role === 'provider' ? 'customer' : 'provider' })} style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0" }}><Text style={{ fontSize: 10, fontWeight: "700", color: "#475569" }}>Toggle Role</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleUserAction(u?.id, 'update', { status: u?.status === 'suspended' ? 'active' : 'suspended' })} style={{ backgroundColor: u?.status === 'suspended' ? "#DCFCE7" : "#FEF2F2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: u?.status === 'suspended' ? "#BBF7D0" : "#FECDD3" }}><Text style={{ fontSize: 10, fontWeight: "700", color: u?.status === 'suspended' ? "#166534" : "#B91C1C" }}>{u?.status === 'suspended' ? 'Activate' : 'Suspend'}</Text></TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <TouchableOpacity onPress={() => { setEditingUser({ ...u, role: u?.role || (u?.roles && u?.roles[0]) || 'customer' }); setModalVisible(true); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 14 }}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleUserAction(u?.id, 'delete')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 14 }}>🗑️</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "verification" && (
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 16 }}>System Monitoring Queue</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748B", marginBottom: 12 }}>ACTIVE MATCHES & JOBS</Text>
              {queue?.length === 0 ? (
                <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 24, alignItems: "center" }}><Text style={{ color: "#94A3B8", fontSize: 13 }}>No active matching transactions</Text></View>
              ) : (
                queue?.map(item => (
                  <View key={item?.id || Math.random()} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: item?.status === 'completed' ? "#10B981" : (item?.status === 'cancelled' ? "#EF4444" : "#3B82F6") }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B" }}>{item?.service_type} Match</Text>
                        <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{item?.customer_name} ➔ {item?.provider_name || 'Searching...'}</Text>
                        <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>ID: {item.id} • {new Date(item?.created_at).toLocaleString()}</Text>
                      </View>
                      <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: "800", color: "#475569" }}>{(item?.status || "").toUpperCase()}</Text></View>
                    </View>
                    {item?.status === 'pending' && (
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                        <TouchableOpacity onPress={() => handleUserAction(item?.id, 'queue_override', { matchId: item.id, action: 'force_complete' })} style={{ flex: 1, backgroundColor: "#10B981", paddingVertical: 8, borderRadius: 6, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Manually Complete</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleUserAction(item?.id, 'queue_override', { matchId: item.id, action: 'cancel' })} style={{ flex: 1, backgroundColor: "#EF4444", paddingVertical: 8, borderRadius: 6, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Force Terminate</Text></TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748B", marginBottom: 12, marginTop: 12 }}>PENDING VERIFICATIONS</Text>
              {pendingProviders?.length === 0 ? (
                <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, alignItems: "center" }}><Text style={{ color: "#94A3B8", fontSize: 13 }}>No pending verifications</Text></View>
              ) : (
                pendingProviders?.map(prov => (
                  <View key={prov.id} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700" }}>{prov.name}</Text>
                    <Text style={{ fontSize: 13, color: "#64748B" }}>{prov.primary_skill || "Provider"}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                      <TouchableOpacity onPress={() => handleUserAction(prov.id, 'approve')} style={{ flex: 1, backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "700" }}>Approve</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleUserAction(prov.id, 'flag')} style={{ flex: 1, borderWidth: 1, borderColor: "#EF4444", padding: 10, borderRadius: 8, alignItems: "center" }}><Text style={{ color: "#EF4444", fontWeight: "700" }}>Flag</Text></TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "settings" && (
            <ScrollView style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingHorizontal: 16 }}>
                {[
                  { id: "verification_queue", label: "Trust Verification Queue" },
                  { id: "match_engine", label: "Match Engine Parameters" }
                ].map(st => (
                  <TouchableOpacity key={st.id} onPress={() => setActiveSubTab(st.id)} style={{ paddingVertical: 12, marginRight: 20, borderBottomWidth: 2, borderBottomColor: activeSubTab === st.id ? COLORS.primary : "transparent" }}><Text style={{ fontSize: 12, fontWeight: "700", color: activeSubTab === st.id ? COLORS.primary : "#64748B" }}>{st.label.toUpperCase()}</Text></TouchableOpacity>
                ))}
              </View>
              <ScrollView style={{ flex: 1, padding: 16 }}>
                {activeSubTab === "verification_queue" && (
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 16 }}>Account Verification Queue</Text>
                    {pendingProviders?.length === 0 ? (
                      <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, alignItems: "center", marginBottom: 24 }}><Text style={{ color: "#94A3B8", fontSize: 13 }}>No pending profiles for review</Text></View>
                    ) : (
                      pendingProviders?.map(prov => (
                        <View key={prov.id} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: "row", gap: 16 }}>
                          <View style={{ flex: 1 }}><Text style={{ fontSize: 16, fontWeight: "700", color: "#1E293B" }}>{prov.name}</Text><Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "600" }}>{prov.primary_skill || "General Trade"}</Text><Text style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{prov.email} • {prov.phone_number}</Text></View>
                          <View style={{ width: 120, gap: 8 }}><TouchableOpacity onPress={() => handleUserAction(prov.id, "approve")} style={{ backgroundColor: "#10B981", padding: 8, borderRadius: 6, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Approve</Text></TouchableOpacity><TouchableOpacity onPress={() => handleUserAction(prov.id, "flag")} style={{ borderWidth: 1, borderColor: "#EF4444", padding: 8, borderRadius: 6, alignItems: "center" }}><Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 11 }}>Flag/Reject</Text></TouchableOpacity></View>
                        </View>
                      ))
                    )}
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 16, marginTop: 12 }}>🤝 Community Vouching Queue</Text>
                    {pendingVouching?.length === 0 ? (
                      <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, alignItems: "center" }}><Text style={{ color: "#94A3B8", fontSize: 13 }}>No community vouchers pending</Text></View>
                    ) : (
                      pendingVouching?.map(vouch => (
                        <View key={vouch.id} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: "row", gap: 16 }}>
                          <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "800", color: "#1E293B" }}>Gatekeeper: {vouch.gatekeeper_name}</Text><Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "700" }}>{vouch.gatekeeper_role}</Text><Text style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Contact: {vouch.gatekeeper_contact}</Text><View style={{ height: 1, backgroundColor: "#E2E8F0", marginVertical: 8 }} /><Text style={{ fontSize: 12, color: "#1E293B" }}>Provider: <Text style={{ fontWeight: "700" }}>{vouch.provider_name}</Text> ({vouch.provider_email})</Text></View>
                          <View style={{ width: 100, gap: 8, justifyContent: "center" }}><TouchableOpacity onPress={() => { fetch(`${API_BASE}/admin/vouch/${vouch.id}/approve`, { method: "POST", headers: { "Authorization": `Bearer ${user?.token}` } }).then(res => res.ok ? (alert("Vouch Approved"), fetchPending()) : alert("Approval failed")); }} style={{ backgroundColor: COLORS.primary, padding: 8, borderRadius: 6, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Verify</Text></TouchableOpacity></View>
                        </View>
                      ))
                    )}
                  </View>
                )}
                {activeSubTab === "match_engine" && (
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 20 }}>Match Engine Parameters</Text>
                    <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 16, elevation: 2 }}>
                      <View style={{ marginBottom: 24 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}><Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>PostGIS Search Radius (km)</Text><Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.primary }}>{systemSettings?.match_radius || 50} km</Text></View><TextInput keyboardType="numeric" value={String(systemSettings?.match_radius || 50)} onChangeText={(val) => setSystemSettings({ ...systemSettings, match_radius: val })} onBlur={() => handleUserAction(null, 'update_settings', { match_radius: systemSettings?.match_radius })} style={{ backgroundColor: "#F1F5F9", padding: 12, borderRadius: 10, fontSize: 15, fontWeight: "600" }} /></View>
                      <View style={{ marginBottom: 24 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}><Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>Global Fee Metric (K)</Text><Text style={{ fontSize: 16, fontWeight: "800", color: "#10B981" }}>K{parseFloat(systemSettings?.platform_fee || 0).toFixed(2)}</Text></View><TextInput keyboardType="numeric" value={String(systemSettings?.platform_fee || 0)} onChangeText={(val) => setSystemSettings({ ...systemSettings, platform_fee: val })} onBlur={() => handleUserAction(null, 'update_settings', { platform_fee: systemSettings?.platform_fee })} style={{ backgroundColor: "#F1F5F9", padding: 12, borderRadius: 10, fontSize: 15, fontWeight: "600" }} /></View>
                      <TouchableOpacity onPress={() => { fetch(`${API_BASE}/admin/match-config`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` }, body: JSON.stringify({ radius: systemSettings?.match_radius, fee: systemSettings?.platform_fee }) }).then(res => res.ok ? alert('Engine updated') : alert('Update failed')); }} style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "800" }}>PUSH ENGINE RELOAD</Text></TouchableOpacity>
                    </View>
                    <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 16, marginTop: 16 }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>System Maintenance Mode</Text><TouchableOpacity onPress={() => { const newVal = !systemSettings?.maintenance_mode; setSystemSettings({ ...systemSettings, maintenance_mode: newVal }); handleUserAction(null, 'update_settings', { maintenance_mode: newVal }); }} style={{ width: 56, height: 30, borderRadius: 15, backgroundColor: systemSettings?.maintenance_mode ? "#EF4444" : "#E2E8F0", padding: 3, flexDirection: systemSettings?.maintenance_mode ? 'row-reverse' : 'row' }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff" }} /></TouchableOpacity></View></View>
                  </View>
                )}
                <View style={{ height: 100 }} />
              </ScrollView>
            </ScrollView>
          )}

          {activeTab === "logs" && (
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B" }}>System Activity Logs</Text>
                <TouchableOpacity onPress={fetchLogs} style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", flexDirection: "row", alignItems: "center", gap: 6 }}><Text style={{ fontSize: 14 }}>🔄</Text><Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>REFRESH</Text></TouchableOpacity>
              </View>
              <View style={{ backgroundColor: "#0F172A", borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: "#334155", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1E293B", paddingBottom: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" }} /><Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>TTY1 / SYSTEM_SERVICE / STDOUT</Text></View>
                {logs?.length === 0 ? (
                  <Text style={{ color: "#475569", fontSize: 12, fontStyle: "italic", textAlign: "center", padding: 20 }}>- No active log stream -</Text>
                ) : (
                  logs?.map(log => (
                    <View key={log.id} style={{ marginBottom: 10, flexDirection: "row", gap: 10 }}>
                      <Text style={{ color: "#475569", fontSize: 11, width: 80, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Text style={{ fontSize: 10, fontWeight: "800", color: log.level === 'SEC' ? "#F87171" : "#22D3EE", backgroundColor: log.level === 'SEC' ? "rgba(248, 113, 113, 0.1)" : "rgba(34, 211, 238, 0.1)", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>{log.level}</Text><Text style={{ color: "#E2E8F0", fontSize: 12, fontWeight: "600", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.message}</Text></View>
                        <Text style={{ color: "#64748B", fontSize: 11, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>PID: {Math.floor(1000 + Math.random() * 9000)} / host.wantok.internal</Text>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: "#1E293B", paddingTop: 8 }}><Text style={{ color: "#22C55E", fontSize: 11, fontWeight: "700", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>$ _</Text></View>
              </View>
            </View>
          )}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {modalVisible && (
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "90%" }}>
            <ScrollView>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#1E293B", marginBottom: 20 }}>{editingUser?.id ? "Edit Account" : "Provision New Account"}</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 }}>FULL NAME</Text>
              <TextInput value={editingUser?.name} onChangeText={(t) => setEditingUser({...editingUser, name: t})} placeholder="e.g. John Doe" style={{ backgroundColor: "#F1F5F9", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 }}>EMAIL ADDRESS</Text>
              <TextInput value={editingUser?.email} onChangeText={(t) => setEditingUser({...editingUser, email: t})} placeholder="e.g. john@example.com" autoCapitalize="none" style={{ backgroundColor: "#F1F5F9", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 }}>PHONE NUMBER</Text>
              <TextInput value={editingUser?.phone_number} onChangeText={(t) => setEditingUser({...editingUser, phone_number: t})} placeholder="e.g. 70000000" style={{ backgroundColor: "#F1F5F9", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 }}>NEW PASSWORD (OPTIONAL)</Text>
              <TextInput value={editingUser?.password} onChangeText={(t) => setEditingUser({...editingUser, password: t})} placeholder="Leave blank to keep current" secureTextEntry style={{ backgroundColor: "#F1F5F9", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 }}>SYSTEM ROLE</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>{['customer', 'provider', 'admin'].map(r => (<TouchableOpacity key={r} onPress={() => setEditingUser({...editingUser, role: r, roles: [r]})} style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: editingUser?.role === r ? COLORS.primary : "#F1F5F9", alignItems: "center" }}><Text style={{ fontSize: 10, fontWeight: "800", color: editingUser?.role === r ? "#fff" : "#64748B" }}>{r.toUpperCase()}</Text></TouchableOpacity>))}</View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><View><Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>Verified Status</Text><Text style={{ fontSize: 12, color: "#64748B" }}>Trust badge visibility</Text></View><TouchableOpacity onPress={() => setEditingUser({...editingUser, is_verified: !editingUser?.is_verified})} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: editingUser?.is_verified ? "#10B981" : "#E2E8F0", padding: 2 }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", transform: [{ translateX: editingUser?.is_verified ? 20 : 0 }] }} /></TouchableOpacity></View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><View><Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>Flag Account</Text><Text style={{ fontSize: 12, color: "#64748B" }}>Restrict access immediately</Text></View><TouchableOpacity onPress={() => setEditingUser({...editingUser, is_flagged: !editingUser?.is_flagged})} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: editingUser?.is_flagged ? "#EF4444" : "#E2E8F0", padding: 2 }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", transform: [{ translateX: editingUser?.is_flagged ? 20 : 0 }] }} /></TouchableOpacity></View>
              <View style={{ flexDirection: "row", gap: 12 }}><TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, padding: 16, alignItems: "center" }}><Text style={{ fontWeight: "700", color: "#64748B" }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => handleUserAction(editingUser?.id, editingUser?.id ? 'update' : 'create', editingUser)} style={{ flex: 1, backgroundColor: "#1E293B", padding: 16, borderRadius: 12, alignItems: "center" }}><Text style={{ fontWeight: "800", color: "#fff" }}>{editingUser?.id ? "Update Account" : "Create User"}</Text></TouchableOpacity></View>
            </ScrollView>
          </View>
        </View>
      )}
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
    }
  }, []);

  const navigate = (to, data = null) => {
    setScreen(to);
    setScreenData(data);
  };

  const handleAuth = (userData, isSignUp = false) => {
    setUser(userData);
    if (Platform.OS === 'web') {
      localStorage.setItem('wantok_user', JSON.stringify(userData));
    }
    setIsAuthenticated(true);
    if (isSignUp) {
      setCurrentUser(null);
      setOnboardingComplete(false);
    } else {
      // Handle login with existing persona
      const persona = userData.active_persona || (userData.roles && userData.roles[0]) || 'customer';
      setCurrentUser(persona);
      if (persona === "admin") setScreen("admin");

      // If provider, check if they have completed profile (role/location)
      if (persona === 'provider' && (!userData.primary_skill || !userData.location_name)) {
        setOnboardingComplete(false);
      } else {
        setOnboardingComplete(true);
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('wantok_user');
    }
    setIsAuthenticated(false);
    setUser(null);
    setCurrentUser(null);
    setOnboardingComplete(false);
    setScreen("home");
  };

  const renderScreen = () => {
    // Hidden Admin Route Handling
    if (screen === "admin-auth") {
      if (isAuthenticated && user?.roles?.includes('admin')) {
        setCurrentUser('admin');
        setScreen('admin');
        setOnboardingComplete(true);
      }
      return <AdminAuthScreen onAuth={(data) => { if (Platform.OS === "web") window.history.replaceState({}, "", "/"); handleAuth(data); }} />;
    }

    // Role-based Access Guard for Admin Screen
    if (screen === "admin" && (!user?.roles?.includes('admin') || currentUser !== 'admin')) {
      alert("Unauthorized access attempt.");
      handleLogout();
      return <AuthScreen onAuth={handleAuth} />;
    }

    if (!isAuthenticated) {
      return <AuthScreen onAuth={handleAuth} />;
    }
    if (!currentUser) {
      return <RoleSelectionScreen onSelectRole={async (role) => {
        // Optimistic UI update
        setCurrentUser(role);
        if (role === "customer") setOnboardingComplete(true);
        else setOnboardingComplete(false);

        // In a real app, we'd call the API here:
        try { await fetch(`${API_BASE}/auth/select-role`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` }, body: JSON.stringify({ role }) }); } catch (e) { console.error("Role selection persistence failed", e); }
      }} />;
    }

    if (currentUser === "provider" && !onboardingComplete) {
      return <ProviderOnboardingScreen user={user} onComplete={(details) => {
        setUser({ ...user, ...details });
        setOnboardingComplete(true);
      }} />;
    }

    switch (screen) {
      case "home":
        return <HomeScreen
          onNavigate={navigate}
          currentUser={currentUser}

          user={user}
          onUpdateUser={(updated) => setUser(updated)}
        />;
      case "workerDetail":
        return <WorkerDetailScreen worker={screenData} onNavigate={navigate} />;
      case "createBooking":
        return <CreateBookingScreen worker={screenData} onNavigate={navigate} user={user} />;
      case "booking":
        return <BookingsScreen onNavigate={navigate} user={user} currentUser={currentUser} />;
      case "trust":
        return <TrustScreen onNavigate={navigate} />;
      case "admin":
        return <AdminScreen onNavigate={navigate} onLogout={handleLogout} user={user} />;
      case "profile":
        return (
          <ProfileScreen
            onNavigate={navigate}
            currentUser={currentUser}

            onLogout={handleLogout}
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
          />
        );
      case "active_jobs":
        return (
          <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>Active Jobs</Text>
            <Text style={{ marginTop: 8, color: COLORS.textMuted }}>No active jobs at the moment.</Text>
          </View>
        );
      case "earnings":
        return (
          <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>Earnings</Text>
            <Text style={{ marginTop: 8, color: COLORS.textMuted }}>K0.00</Text>
          </View>
        );
      default:
        return <HomeScreen
          onNavigate={navigate}
          currentUser={currentUser}

          user={user}
          onUpdateUser={(updated) => setUser(updated)}
        />;
    }
  };

  const activeNav = ["home", "trust", "booking", "profile", "active_jobs", "earnings"].includes(screen)
    ? screen
    : "home";

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
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          <Image
            source={require("./assets/brand_logo.jpg")}
            style={{ width: 32, height: 32, borderRadius: 16, resizeMode: "contain" }}
          />
          <Text
            style={{
              color: "#fff",
              fontWeight: "900",
              fontSize: 15,
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
    </SafeAreaView>
  );
}

function WorkerCard({ worker, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        flexDirection: "row",
        gap: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
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
              borderRadius: 8,
              backgroundColor: "#10B981",
              borderWidth: 2,
              borderColor: "#fff",
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}
              >
                {worker?.name || "Anonymous Worker"}
              </Text>
              {worker?.is_verified && <TrustBadge />}
            </View>
            <Text
              style={{
                marginTop: 2,
                fontSize: 13,
                color: COLORS.primary,
                fontWeight: "600",
              }}
            >
              {worker?.primary_skill || "General Trade"}
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 12, color: COLORS.textMuted }}
            >
              📞 {worker?.phone_number || "No contact info"}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginVertical: 6,
          }}
        >
          <StarRating rating={worker?.rating || 5.0} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.text }}>
            {worker?.rating || "5.0"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
              📍 {worker?.distance_km
                ? parseFloat(worker?.distance_km || 0).toFixed(1) + " km away"
                : worker?.location_name || "Port Moresby"}
            </Text>
          </View>
          {worker?.hourly_rate && (
            <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.primary }}>
              K{worker?.hourly_rate}/hr
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
