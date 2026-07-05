import sys
import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

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

# Find the partially broken block and fix it
pattern = re.compile(r'<View style=\{\{\s*flexDirection:\s*\'row\',\s*alignItems:\s*\'center\',\s*marginTop:\s*4,\s*gap:\s*4\s*\}\}>\s*<Text style=\{\{\s*fontSize:\s*12,\s*color:\s*COLORS\.textLight\s*\}\}>📞</Text>\s*\{\(worker\?\.phone_number\s*\|\|\s*worker\?\.phone\s*\|\|\s*worker\?\.phoneNumber\)\s*\?\s*\(\s*<TouchableOpacity\s*onPress=\{\(\)\s*=>\s*Linking\.openURL\(\)\}>\s*<Text\s*style=\{\{\s*fontSize:\s*12,\s*color:\s*\'#0B5932\',\s*fontWeight:\s*\'700\',\s*textDecorationLine:\s*\'underline\'\s*\}\}>\s*\{worker\.phone_number\s*\|\|\s*worker\.phone\s*\|\|\s*worker\.phoneNumber\}\s*</Text>\s*</TouchableOpacity>\s*\)\s*:\s*\(\s*<Text\s*style=\{\{\s*fontSize:\s*12,\s*color:\s*COLORS\.textLight,\s*fontStyle:\s*\'italic\'\s*\}\}>No\s*contact\s*info</Text>\s*\)\}\s*</View>', re.DOTALL)

content = pattern.sub(new_block, content)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
