import sys

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

old_block = """            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
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

new_block = """            {(() => {
              // Check every possible database key variation for the registered signup number
              const registeredNumber = worker.phone ||
                                       worker.phoneNumber ||
                                       worker.mobile ||
                                       worker.phone_number ||
                                       (worker.username && /^\\d+$/.test(worker.username) ? worker.username : '');

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

content = content.replace(old_block, new_block)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
