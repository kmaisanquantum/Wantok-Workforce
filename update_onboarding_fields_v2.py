import sys

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Update ProviderOnboardingScreen to include all Storefront fields
old_onboarding_start = "function ProviderOnboardingScreen({ onComplete, user, showAlert }) {"
new_onboarding_code = """function ProviderOnboardingScreen({ onComplete, user, showAlert }) {
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
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
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
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 8, marginTop: 40 }}>
        Setup Your Storefront
      </Text>
      <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 32 }}>
        Configure your basic storefront details to start accepting jobs immediately.
      </Text>

      <InputField label="Business Name" value={formData.business_name} onChange={v => setFormData({...formData, business_name: v})} placeholder="Trading name (e.g. John's Electric)" />

      <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textLight, marginBottom: 6 }}>Service Category</Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              onPress={() => setFormData({...formData, service_category: cat.label})}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                backgroundColor: formData.service_category === cat.label ? COLORS.primary : '#F3F4F6',
                borderWidth: 1, borderColor: COLORS.border
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: formData.service_category === cat.label ? '#fff' : COLORS.text }}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <InputField label="Professional Bio" value={formData.bio} onChange={v => setFormData({...formData, bio: v})} placeholder="Briefly describe your skills..." multiline />

      <View style={{ flexDirection: 'row', gap: 16 }}>
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
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
          marginTop: 20,
          marginBottom: 40,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          {loading ? "SAVING..." : "ACTIVATE MY STOREFRONT"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}"""

# Find end of ProviderOnboardingScreen
start_idx = content.find(old_onboarding_start)
end_idx = content.find("function ProviderProfileForm")

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_onboarding_code + "\n\n" + content[end_idx:]

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
