const fs = require('fs');

let content = fs.readFileSync('WantokWorkforce.js', 'utf8');

// 1. Ensure customAlert and workers are initialized at the top of App
content = content.replace(/const \[customAlert, setCustomAlert\] = useState\(.*?\);\s*/g, '');
content = content.replace(/const showAlert = \(message\) => setCustomAlert\(.*?\);\s*/g, '');
content = content.replace(/const \[workers, setWorkers\] = useState\(.*?\);\s*/g, '');

const appInitCode = "export default function App() {\n  const [customAlert, setCustomAlert] = useState({ visible: false, message: '' });\n  const showAlert = (message) => setCustomAlert({ visible: true, message });\n  const [workers, setWorkers] = useState(null);";

content = content.replace('export default function App() {', appInitCode);

// 2. Add useEffect to fetch workers in App so it's not stuck on Loading
const useEffectCode = `
  useEffect(() => {
    const fetchInitialWorkers = async () => {
      try {
        const res = await fetch(\`\${API_BASE}/match/nearby\`);
        const data = await res.json();
        if (data.success && Array.isArray(data.workers)) {
          setWorkers(data.workers);
        } else {
          setWorkers([]);
        }
      } catch (e) {
        setWorkers([]);
      }
    };
    fetchInitialWorkers();
  }, []);
`;

// Insert useEffect after state declarations in App
const appInitPos = content.indexOf('const [workers, setWorkers] = useState(null);');
if (appInitPos !== -1) {
    const nextLineEnd = content.indexOf('\n', appInitPos);
    content = content.slice(0, nextLineEnd + 1) + useEffectCode + content.slice(nextLineEnd + 1);
}

// 3. Implement the safety check exactly as requested but with RN components for safety
// unless I'm sure it's web-only. The user used 'div' and 'className'.
// I'll use a hybrid or just View/Text which is safer.
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

const mainReturnMatch = content.match(/return \([\s\n]*<SafeAreaView/);
if (mainReturnMatch) {
    content = content.slice(0, mainReturnMatch.index) + safetyCheck + "\n  " + content.slice(mainReturnMatch.index);
}

// 4. Robust property safety in WorkerCard
content = content.replace(/worker\.phone \|\|/g, 'worker?.phone ||');
content = content.replace(/worker\.phoneNumber \|\|/g, 'worker?.phoneNumber ||');
content = content.replace(/worker\.mobile \|\|/g, 'worker?.mobile ||');
content = content.replace(/worker\.phone_number \|\|/g, 'worker?.phone_number ||');
content = content.replace(/worker\.username/g, 'worker?.username');

// 5. Global .length safety
content = content.replace(/(?<!\?)\.length(?!\s*<)/g, '?.length'); // Be careful with .length < 3
// Revert for comparisons if needed, or just ensure they are safe
content = content.replace(/rawInput\?\.length/g, 'rawInput.length');
content = content.replace(/word\?\.length/g, 'word.length');
content = content.replace(/password\?\.length/g, 'password.length');

// 6. Clean up any corrupted StatusBar or other lines
content = content.replace(/StatusBar barStyle="light-content" backgroundColor=\{COLORS\.stat\n\s*usBar\}/g, 'StatusBar barStyle="light-content" backgroundColor={COLORS.statusBar}');

fs.writeFileSync('WantokWorkforce.js', content);
