const fs = require('fs');

let content = fs.readFileSync('WantokWorkforce.js', 'utf8');

// 1. Remove all misplaced Modal blocks that refer to isChatVisible except in WorkerDetailScreen
const modalPattern = /<Modal visible=\{isChatVisible\} animationType="slide" transparent=\{true\}>[\s\S]*?<\/Modal>/g;
content = content.replace(modalPattern, '');

// 2. Add it back to WorkerDetailScreen correctly
const workerDetailPos = content.indexOf('function WorkerDetailScreen');
if (workerDetailPos !== -1) {
    const endOfScrollView = content.indexOf('</ScrollView>', workerDetailPos);
    if (endOfScrollView !== -1) {
        const modalCode = `
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
              {(messages || []).map((msg, idx) => {
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
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12 }}
              />
              <TouchableOpacity onPress={handleSendMessage} style={{ backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>`;
        content = content.slice(0, endOfScrollView + 13) + modalCode + content.slice(endOfScrollView + 13);
    }
}

// 3. Fix App component structure
content = content.replace(/const \[customAlert, setCustomAlert\] = useState\(.*?\);\s*/g, '');
content = content.replace(/const showAlert = \(message\) => setCustomAlert\(.*?\);\s*/g, '');
content = content.replace(/const \[workers, setWorkers\] = useState\(.*?\);\s*/g, '');

content = content.replace('export default function App() {', "export default function App() {\n  const [customAlert, setCustomAlert] = useState({ visible: false, message: '' });\n  const showAlert = (message) => setCustomAlert({ visible: true, message });\n  const [workers, setWorkers] = useState([]);");

// Remove previous safety checks
content = content.replace(/\n\s*if \(!workers \|\| !Array\.isArray\(workers\)\) \{[\s\S]*?\n\s*\}/g, '');

const safetyCheck = `
  if (!workers || !Array.isArray(workers)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontWeight: '500' }}>Loading Wantok Workforce profiles safely...</Text>
        </View>
      </View>
    );
  }
`;

// Find the position before the main return
const mainReturnMatch = content.match(/return \([\s\n]*<SafeAreaView/);
if (mainReturnMatch) {
    content = content.slice(0, mainReturnMatch.index) + safetyCheck + "\n  " + content.slice(mainReturnMatch.index);
}

fs.writeFileSync('WantokWorkforce.js', content);
