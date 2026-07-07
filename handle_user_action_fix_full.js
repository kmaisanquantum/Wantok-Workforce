  const handleUserAction = async (userId, action, data = {}) => {
    try {
      const adminToken = user?.token;
      let res;
      if (action === 'delete') res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === 'update') res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(data) });
      else if (action === 'create') res = await fetch(`${API_BASE}/admin/users`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(data) });
      else if (action === 'approve') res = await fetch(`${API_BASE}/admin/approve-provider/${userId}`, { method: "PATCH", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === 'flag') res = await fetch(`${API_BASE}/admin/flag-user/${userId}`, { method: "PATCH", headers: { "Authorization": `Bearer ${adminToken}` } });
      else if (action === "update_settings") {
        const key = Object.keys(data)[0];
        res = await fetch(`${API_BASE}/admin/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify({ key, value: data[key] })
        });
      } else if (action === "review_match") {
        res = await fetch(`${API_BASE}/admin/queue/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify(data)
        });
      } else if (action === "release_payout") {
        res = await fetch(`${API_BASE}/admin/release-payout/${userId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
      } else if (action === "refund_escrow") {
        res = await fetch(`${API_BASE}/admin/refund-escrow/${userId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
      } else if (action === 'queue_override') {
        res = await fetch(`${API_BASE}/admin/queue/override`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify(data)
        });
      }

      if (res && res.ok) {
        if (activeTab === "users") fetchUsers();
        if (activeTab === "verification") { fetchPending(); fetchQueue(); }
        if (activeTab === "dashboard") fetchStats();
        setModalVisible(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert(errData.error || "Action failed");
      }
    } catch (e) { showAlert("Error connecting to server"); }
  };
