import sys
import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Update WorkerDetailScreen signature to include user
content = content.replace('function WorkerDetailScreen({ worker, onNavigate, showAlert }) {', 'function WorkerDetailScreen({ worker, onNavigate, showAlert, user }) {')

# 2. Add Chat implementation inside WorkerDetailScreen
chat_impl = """  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
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
    if (!newMessage.trim() || !user || !worker) return;
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          receiverId: worker.id, // Assuming worker.id is the recipient User ID for simplicity in this flow
          providerId: worker.id,
          text: newMessage.trim()
        })
      });
      if (res.ok) {
        setNewMessage("");
        fetchHistory();
      }
    } catch (e) {
      showAlert("Failed to send message");
    }
  };
"""

# Insert chat_impl at start of WorkerDetailScreen
content = content.replace('function WorkerDetailScreen({ worker, onNavigate, showAlert, user }) {', 'function WorkerDetailScreen({ worker, onNavigate, showAlert, user }) {\n' + chat_impl)

# 3. Add Chat Now button in JSX
chat_button = """
          <TouchableOpacity
            onPress={() => setIsChatVisible(true)}
            style={{ borderHorizontal: 0, borderWidth: 1, borderColor: '#0B5932', padding: 16, borderRadius: 12, alignItems: "center", marginTop: 12 }}
          >
            <Text style={{ color: "#0B5932", fontWeight: "800" }}>Chat Now</Text>
          </TouchableOpacity>
"""
# Insert before Go Back
content = content.replace('<TouchableOpacity onPress={() => onNavigate("home")} style={{ marginTop: 16, alignItems: "center" }}>', chat_button + '\n          <TouchableOpacity onPress={() => onNavigate("home")} style={{ marginTop: 16, alignItems: "center" }}>')

# 4. Add Chat Modal JSX at the end of WorkerDetailScreen return
chat_modal = """
      <Modal visible={isChatVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Chat with {worker?.name}</Text>
              <TouchableOpacity onPress={() => setIsChatVisible(false)}>
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 20 }}>
              {messages.map((msg, idx) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <View key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? '#0B5932' : '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%' }}>
                    <Text style={{ color: isMine ? '#fff' : COLORS.text, fontSize: 14 }}>{msg.text}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 14 }}
              />
              <TouchableOpacity onPress={handleSendMessage} style={{ backgroundColor: '#0B5932', padding: 12, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
"""

# Insert before final closing </View> of WorkerDetailScreen
content = content.replace('      </ScrollView>\n    </View>', '      </ScrollView>\n' + chat_modal + '    </View>')

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
