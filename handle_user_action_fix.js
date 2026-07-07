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
