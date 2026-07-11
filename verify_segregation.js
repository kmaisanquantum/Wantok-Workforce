const AdminController = require('./backend/src/admin/controllers/admin_controller');
const UserModel = require('./backend/src/auth/models/user_model');

async function test() {
    console.log("--- Testing Segregation Logic ---");

    const mockRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.data = data; return this; }
    };

    // Mock Pool query to capture the generated SQL
    const originalQuery = UserModel.getPool().query;
    let capturedSQL = "";
    UserModel.getPool().query = async (sql, params) => {
        capturedSQL = sql;
        return { rows: [] };
    };

    // Test Provider Filter
    await AdminController.getAllUsers({ query: { role: 'Service Providers' } }, mockRes);
    console.log("Provider Filter SQL contains 'NOT':", capturedSQL.includes("AND NOT"));
    console.log("Provider Filter SQL contains 'provider':", capturedSQL.includes("'provider'"));

    // Test Customer Filter
    await AdminController.getAllUsers({ query: { role: 'Customers' } }, mockRes);
    console.log("Customer Filter SQL contains 'NOT':", capturedSQL.includes("AND NOT"));
    console.log("Customer Filter SQL contains 'provider':", capturedSQL.includes("'provider'"));
    console.log("Customer Filter SQL contains 'customer':", capturedSQL.includes("'customer'"));

    // Restore
    UserModel.getPool().query = originalQuery;
}

test().catch(console.error);
