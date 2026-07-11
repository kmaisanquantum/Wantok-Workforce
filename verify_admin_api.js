const AdminController = require('./backend/src/admin/controllers/admin_controller');
const UserModel = require('./backend/src/auth/models/user_model');

async function test() {
    console.log("--- Testing AdminController.getAllUsers ---");

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

    // Test Case 1: Role mapping for "Service Providers"
    const req1 = { query: { role: 'Service Providers' } };
    await AdminController.getAllUsers(req1, mockRes);
    console.log("1. 'Service Providers' mapping result count:", mockRes.data.users ? mockRes.data.users.length : 'ERROR');
    if (mockRes.data.users && mockRes.data.users.length > 0) {
        console.log("   First user roles:", mockRes.data.users[0].roles);
    }

    // Test Case 2: Role mapping for "Customers"
    const req2 = { query: { role: 'Customers' } };
    await AdminController.getAllUsers(req2, mockRes);
    console.log("2. 'Customers' mapping result count:", mockRes.data.users ? mockRes.data.users.length : 'ERROR');

    // Test Case 3: No role filter
    const req3 = { query: {} };
    await AdminController.getAllUsers(req3, mockRes);
    console.log("3. No role filter result count:", mockRes.data.users ? mockRes.data.users.length : 'ERROR');

    console.log("\n--- Testing AdminController.getDashboardMetrics ---");
    await AdminController.getDashboardMetrics({}, mockRes);
    console.log("Metrics result:", mockRes.data.data);

    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
