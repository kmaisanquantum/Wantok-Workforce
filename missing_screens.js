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

function CreateBookingScreen({ worker, onNavigate }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 10, color: COLORS.text }}>Book {worker?.name}</Text>
      <Text style={{ textAlign: "center", color: COLORS.textMuted, marginBottom: 30 }}>Confirm your request for {worker?.primary_skill} services.</Text>
      <TouchableOpacity
        onPress={() => { alert("Booking Request Sent!"); onNavigate("booking"); }}
        style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Confirm Booking</Text>
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
      <ScrollView>
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
      </ScrollView>
    </View>
  );
}
