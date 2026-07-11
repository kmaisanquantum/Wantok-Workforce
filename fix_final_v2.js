const fs = require('fs');
let content = fs.readFileSync('WantokWorkforce.js', 'utf8');

const targetTrailing = `    </ScrollView>
  </View>
);
}

export default WantokWorkforce;`;

// Find the last function or return statement end.
// We want to replace from line 2061 roughly.
const lines = content.split('\n');
const newLines = lines.slice(0, lines.length - 10); // Take all but last 10 lines
const finalContent = newLines.join('\n') + '\n' + targetTrailing;

fs.writeFileSync('WantokWorkforce.js', finalContent);
