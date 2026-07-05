import sys
import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Add Linking to imports
if 'Linking' not in content:
    content = content.replace('Platform,', 'Platform, Linking,')

# 2. Update WorkerCard
# Target pattern:
#             <Text
#               style={{ marginTop: 4, fontSize: 12, color: COLORS.textMuted }}
#             >
#               📞 {worker?.phone_number || "No contact info"}
#             </Text>

new_block = """            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
              <Text style={{ fontSize: 12, color: COLORS.textLight }}>📞</Text>
              {(worker?.phone_number || worker?.phone || worker?.phoneNumber) ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${(worker.phone_number || worker.phone || worker.phoneNumber).trim()}`)}>
                  <Text style={{ fontSize: 12, color: '#0B5932', fontWeight: '700', textDecorationLine: 'underline' }}>
                    {worker.phone_number || worker.phone || worker.phoneNumber}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' }}>No contact info</Text>
              )}
            </View>"""

pattern = re.compile(r'<Text\s+style=\{\{\s*marginTop:\s*4,\s*fontSize:\s*12,\s*color:\s*COLORS\.textMuted\s*\}\}\s*>\s*📞\s*\{worker\?\.phone_number\s*\|\|\s*\"No contact info\"\}\s*</Text>', re.DOTALL)
content = pattern.sub(new_block, content)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
