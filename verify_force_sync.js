const AdminController = require('./backend/src/admin/controllers/admin_controller');
const UserModel = require('./backend/src/auth/models/user_model');

async function test() {
    console.log("--- Testing AdminController.forceSyncUsers ---");

    const mockRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.data = data;
            return this;
        }
    };

    const req = {};
    await AdminController.forceSyncUsers(req, mockRes);

    if (mockRes.statusCode === 200) {
        console.log("✅ Success: Status 200");
        console.log("✅ Data returned:", mockRes.data.success);
        console.log("✅ User count:", mockRes.data.users ? mockRes.data.users.length : 'ERROR');
        if (mockRes.data.users && mockRes.data.users.length > 0) {
             console.log("✅ First user has roles:", !!mockRes.data.users[0].roles);
        }
    } else {
        console.log("❌ Failed: Status", mockRes.statusCode);
        console.log("Error details:", mockRes.data);
    }

    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
