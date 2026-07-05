import sys

def apply_patch(file_path, search_text, replace_text):
    with open(file_path, 'r') as f:
        content = f.read()

    if search_text in content:
        new_content = content.replace(search_text, replace_text)
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Patch applied successfully.")
    else:
        print("Search text not found.")
        sys.exit(1)

search = """  const fetchNearbyProviders = async () => {
    setIsSearching(true);
    const lat = -9.4438;
    const lon = 147.1803;

    try {
      // Fetch the broad list of providers using the base endpoint
      const url = `${API_BASE}/match/nearby?latitude=${lat}&longitude=${lon}`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: "Invalid response from server" }));

      if (response.ok) {
        const query = (searchText || "").toLowerCase().trim();
        const openSearchResults = (data.workers || []).filter(worker => {
          if (!query) return true;
          return (
            (worker.name || '').toLowerCase().includes(query) ||
            (worker.role || '').toLowerCase().includes(query) ||
            (worker.bio || '').toLowerCase().includes(query) ||
            (worker.category || '').toLowerCase().includes(query) ||
            (worker.skills && worker.skills.some(skill => skill.toLowerCase().includes(query)))
          );
        });
        setNearbyWorkers(openSearchResults);
      } else {
        setNearbyWorkers([]);
      }
    } catch (error) {
      console.error("Match fetch failed:", error);
      setNearbyWorkers([]);
    } finally {
      setIsSearching(false);
    }
  };"""

replace = """  const fetchNearbyProviders = async () => {
    setIsSearching(true);
    try {
      // Request the entire list of workers without any category filters or parameters
      const url = `${API_BASE}/match/nearby`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: "Invalid response from server" }));

      if (response.ok) {
        const query = (searchText || "").toLowerCase().trim();
        const allWorkers = data.workers || [];

        const openResults = allWorkers.filter(worker => {
          if (!query) return true;

          const nameMatch = (worker.name || '').toLowerCase().includes(query);
          const roleMatch = (worker.role || '').toLowerCase().includes(query);
          const bioMatch = (worker.bio || '').toLowerCase().includes(query);
          const categoryMatch = (worker.category || '').toLowerCase().includes(query);

          // Check skills array if it exists
          const skillsMatch = worker.skills && Array.isArray(worker.skills) && worker.skills.some(skill =>
            skill.toLowerCase().includes(query)
          );

          return nameMatch || roleMatch || bioMatch || categoryMatch || skillsMatch;
        });

        setNearbyWorkers(openResults);
      } else {
        setNearbyWorkers([]);
      }
    } catch (error) {
      console.error("Match fetch failed:", error);
      setNearbyWorkers([]);
    } finally {
      setIsSearching(false);
    }
  };"""

apply_patch('WantokWorkforce.js', search, replace)
