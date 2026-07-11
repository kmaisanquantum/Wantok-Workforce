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
    <View style={{ gap: 16, marginTop: 16 }}>
      <View style={{ backgroundColor: COLORS.primaryDark, borderRadius: 20, padding: 20 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>'De Facto' Employment Ledger</Text>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", marginVertical: 10 }}>K{Number(ledger.metrics.totalEarned).toFixed(2)}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>In Escrow</Text>
            <Text style={{ color: "#fff", fontWeight: "700" }}>K{Number(ledger.metrics.fundsInEscrow).toFixed(2)}</Text>
          </View>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Wallet</Text>
            <Text style={{ color: "#fff", fontWeight: "700" }}>K{Number(ledger.metrics.withdrawnToWallet).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginLeft: 4 }}>Work History Cards</Text>
      {ledger.history.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16 }}><Text style={{ color: COLORS.textMuted }}>No completed jobs yet.</Text></View>
      ) : (
        ledger.history.map((job) => (
          <View key={job.id} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontWeight: "800", color: COLORS.text }}>{job.service_type}</Text>
              <Text style={{ fontWeight: "900", color: COLORS.primary }}>K{Number(job.price).toFixed(2)}</Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Client: {job.customer_name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 14, marginRight: 5 }}>⭐</Text>
                <Text style={{ fontWeight: "700", color: COLORS.accent }}>{job.feedback_rating || 5.0}</Text>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.textLight }}>{new Date(job.completed_at || Date.now()).toLocaleDateString()}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
