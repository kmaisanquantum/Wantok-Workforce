  if (currentUser === "provider") {
    const [vStatus, setVStatus] = useState({ verified: false, vouch_status: 'none' });
    const fetchVerification = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/providers/verification-status`, {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) setVStatus(data);
      } catch (err) {}
    };
    useEffect(() => { fetchVerification(); }, []);

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 6 }}>
                  <Text style={{ color: \"rgba(255,255,255,0.7)\", fontSize: 13 }}>Welcome Back, Provider</Text>
                  {vStatus.verified && (
                    <View style={{ backgroundColor: COLORS.accent, borderRadius: 4, paddingHorizontal: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: \"900\", color: \"#fff\" }}>VERIFIED</Text>
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
          <View style={{ padding: 16, marginTop: -20, gap: 16 }}>
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
                    await fetch(`${API_BASE}/auth/availability`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` }, body: JSON.stringify({ is_available: newStatus }) });
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
              <View style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}><View style={{ width: vStatus.verified ? \"98%\" : \"92%\", height: \"100%\", backgroundColor: COLORS.primary }} /></View>
            </View>

            {/* PART B: Financial Ledger */}
            <ProviderFinancialDashboard user={user} />

            {/* PART A: Vouching Component (Show if not verified) */}
            {!vStatus.verified && vStatus.vouch_status !== 'pending' && (
              <ProviderVouchingForm user={user} onVouchSubmitted={fetchVerification} />
            )}
            {vStatus.vouch_status === 'pending' && (
              <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: \"center\", borderStyle: \"dashed\", borderWidth: 1, borderColor: COLORS.primary }}>
                <Text style={{ fontSize: 16, fontWeight: \"800\", color: COLORS.primary }}>⏳ Verification Pending</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: \"center\" }}>Your community gatekeeper request is being reviewed by the Wantok team.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
