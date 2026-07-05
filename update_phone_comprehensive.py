import sys
import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Using raw string for new_block and properly escaping backslashes for regex sub
new_block = r"""            {(() => {
              // Check every possible database key variation for the registered signup number
              const registeredNumber = worker.phone ||
                                       worker.phoneNumber ||
                                       worker.mobile ||
                                       worker.phone_number ||
                                       (worker.username && /^\d+$/.test(worker.username) ? worker.username : '');

              if (registeredNumber) {
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Text style={{ fontSize: 12, color: COLORS.textLight }}>📞</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${String(registeredNumber).trim()}`)}>
                      <Text style={{ fontSize: 12, color: '#0B5932', fontWeight: '800', textDecorationLine: 'underline' }}>
                        {registeredNumber}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textLight }}>📞</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' }}>No contact info</Text>
                </View>
              );
            })()}"""

# Escape backslashes and backticks for the substitution
new_block = new_block.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')

pattern = re.compile(r'<View style=\{\{\s*flexDirection:\s*\'row\',\s*alignItems:\s*\'center\',\s*marginTop:\s*4,\s*gap:\s*4\s*\}\}>\s*<Text style=\{\{\s*fontSize:\s*12,\s*color:\s*COLORS\.textLight\s*\}\}>📞</Text>\s*\{\(worker\?\.phone_number\s*\|\|\s*worker\?\.phone\s*\|\|\s*worker\?\.phoneNumber\)\s*\?\s*\(\s*<TouchableOpacity\s*onPress=\{\(\)\s*=>\s*Linking\.openURL\(`tel:\$\{ \(worker\.phone_number\s*\|\|\s*worker\.phone\s*\|\|\s*worker\.phoneNumber\)\.trim\(\)\}\`\)\}>\s*<Text\s*style=\{\{\s*fontSize:\s*12,\s*color:\s*\'#0B5932\',\s*fontWeight:\s*\'700\',\s*textDecorationLine:\s*\'underline\'\s*\}\}>\s*\{worker\.phone_number\s*\|\|\s*worker\.phone\s*\|\|\s*worker\.phoneNumber\}\s*</Text>\s*</TouchableOpacity>\s*\)\s*:\s*\(\s*<Text\s*style=\{\{\s*fontSize:\s*12,\s*color:\s*COLORS\.textLight,\s*fontStyle:\s*\'italic\'\s*\}\}>No\s*contact\s*info</Text>\s*\)\}\s*</View>', re.DOTALL)

content = pattern.sub(new_block, content)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
