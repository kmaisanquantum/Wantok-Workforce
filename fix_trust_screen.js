const fs = require('fs');
let content = fs.readFileSync('WantokWorkforce.js', 'utf8');

const trailing = `          ))}
        </View>
      </ScrollView>
    </View>
  );
}`;

const mapEnd = '          ))}';
const index = content.indexOf(mapEnd);
if (index !== -1) {
    const nextSect = content.indexOf('const PROVIDER_NAV_ITEMS', index);
    const newContent = content.substring(0, index) + trailing + '\n}\n\n' + content.substring(nextSect);
    fs.writeFileSync('WantokWorkforce.js', newContent);
}
