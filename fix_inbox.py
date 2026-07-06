import sys
content = open('WantokWorkforce.js').read()

customer_inbox_code = """
function CustomerInboxScreen({ user, showAlert }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");

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
    if (!replyText.trim() || !selectedConv) return;
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          receiverId: selectedConv.other_party_id,
          providerId: selectedConv.provider_id,
          text: replyText.trim()
        })
      });
      if (res.ok) {
        setReplyText("");
        fetchChatHistory(selectedConv.other_party_id, selectedConv.provider_id);
      }
    } catch (e) {
      showAlert("Failed to send reply");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        {/* Left Sidebar: Inbox List */}
        <View style={{ width: isDesktop ? 350 : '100%', borderRightWidth: isDesktop ? 1 : 0, borderRightColor: COLORS.border, borderBottomWidth: isDesktop ? 0 : 1, borderBottomColor: COLORS.border, backgroundColor: '#fff' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Inbox</Text>
          </View>
          <ScrollView>
            {(conversations || [])?.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>No conversations yet.</Text>
              </View>
            ) : conversations.map((conv, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedConv(conv)}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F1F5F9',
                  backgroundColor: selectedConv?.other_party_id === conv.other_party_id ? '#F0FDF4' : '#fff'
                }}
              >
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '800' }}>{conv.other_party_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '700', color: COLORS.text }}>{conv.other_party_name}</Text>
                      <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 }}>{conv.other_party_category || 'Service Provider'}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{conv.last_message}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Chat Window */}
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {selectedConv ? (
            <View style={{ flex: 1 }}>
              <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {!isDesktop && (
                  <TouchableOpacity onPress={() => setSelectedConv(null)} style={{ marginRight: 8 }}>
                    <Text style={{ fontSize: 18 }}>⬅️</Text>
                  </TouchableOpacity>
                )}
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{selectedConv.other_party_name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '800', color: COLORS.text }}>{selectedConv.other_party_name}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{selectedConv.other_party_category || 'Service Provider'}</Text>
                </View>
              </View>

              <ScrollView style={{ flex: 1, padding: 16 }}>
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <View key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? COLORS.primary : '#fff', padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: '80%', elevation: 1 }}>
                      <Text style={{ color: isMine ? '#fff' : COLORS.text, fontSize: 14 }}>{msg.text}</Text>
                      <Text style={{ fontSize: 9, color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.textMuted, marginTop: 4, textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Type your reply..."
                  style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, fontSize: 14 }}
                  multiline
                />
                <TouchableOpacity onPress={handleSendReply} style={{ backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>💬</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600' }}>Select a conversation to start chatting</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
"""

marker = "function ProviderInboxScreen"
if marker in content:
    open('WantokWorkforce.js', 'w').write(content.replace(marker, customer_inbox_code + marker))
    print("CustomerInboxScreen added")
else:
    print("ProviderInboxScreen NOT found")
