const { roleCheckMiddleware } = require('./backend/src/auth/middlewares/auth');

async function test() {
    console.log("--- Testing roleCheckMiddleware RBAC Override ---");

    const middleware = roleCheckMiddleware(['admin']);
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

    // Test Case 1: Active Persona is admin
    const req1 = { user: { active_persona: 'admin', roles: ['admin'] } };
    let called1 = false;
    middleware(req1, mockRes, () => { called1 = true; });
    console.log("1. Active admin persona result:", called1 ? "PASSED" : "FAILED");

    // Test Case 2: Active Persona is provider, but user HAS admin role
    const req2 = { user: { active_persona: 'provider', roles: ['admin', 'provider'], email: 'test@admin.com' } };
    let called2 = false;
    middleware(req2, mockRes, () => { called2 = true; });
    console.log("2. Admin override result (provider persona):", called2 ? "PASSED" : "FAILED");

    // Test Case 3: Active Persona is provider, user DOES NOT have admin role
    const req3 = { user: { active_persona: 'provider', roles: ['provider'] } };
    let called3 = false;
    middleware(req3, mockRes, () => { called3 = true; });
    console.log("3. Non-admin denied result:", !called3 && mockRes.statusCode === 403 ? "PASSED" : "FAILED");

    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
