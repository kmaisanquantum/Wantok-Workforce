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
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
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

      const data = await response.json();
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
