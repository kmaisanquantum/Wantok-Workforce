const fs = require('fs');
const content = fs.readFileSync('WantokWorkforce.js', 'utf8');

const screens = [
  'WorkerDetailScreen',
  'CreateBookingScreen',
  'ProfileScreen'
];

screens.forEach(screen => {
  const isDefined = content.includes(`function ${screen}`) || content.includes(`${screen} =`);
  const isUsed = content.includes(`<${screen}`);
  console.log(`${screen}: Defined=${isDefined}, Used=${isUsed}`);
});
