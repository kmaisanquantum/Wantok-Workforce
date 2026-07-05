const fs = require('fs');
const path = require('path');

console.log("Checking database patch...");
const patchPath = path.join(__dirname, 'backend/db/patch_messages.sql');
if (fs.existsSync(patchPath)) {
    console.log("✅ patch_messages.sql exists");
} else {
    console.error("❌ patch_messages.sql missing");
}

console.log("Checking route registration in server.js...");
const serverContent = fs.readFileSync(path.join(__dirname, 'backend/server.js'), 'utf8');
if (serverContent.includes("app.use('/api/messages', messageRoutes)")) {
    console.log("✅ messageRoutes registered in app");
} else {
    console.error("❌ messageRoutes NOT registered");
}

console.log("Checking MessageController methods...");
const controllerContent = fs.readFileSync(path.join(__dirname, 'backend/src/match/controllers/message_controller.js'), 'utf8');
if (controllerContent.includes("sendMessage") && controllerContent.includes("getChatHistory") && controllerContent.includes("getInbox")) {
    console.log("✅ MessageController has all required methods");
} else {
    console.error("❌ MessageController missing methods");
}
