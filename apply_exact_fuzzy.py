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

    const SYNONYM_EXTENSIONS = {
      'law': 'Legal',
      'lawyer': 'Legal',
      'lawyers': 'Legal',
      'fintech': 'FinTech',
      'finance': 'FinTech',
      'agritech': 'AgriTech',
      'agriculture': 'AgriTech'
    };

    try {
      // Fetch the full list of providers
      const url = `${API_BASE}/match/nearby`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: "Invalid response from server" }));
      const workers = data.workers || [];

      if (response.ok) {
        const rawInput = (searchText || '').trim();
        const normalizedInput = rawInput.toLowerCase();

        if (!rawInput) {
          setNearbyWorkers(workers);
        } else {
          // Standardize search criteria with synonym roots
          const extendedKeyword = SYNONYM_EXTENSIONS[normalizedInput]
            ? `${rawInput} ${SYNONYM_EXTENSIONS[normalizedInput]}`
            : rawInput;

          const finalQuery = extendedKeyword.toLowerCase();

          // Scoring-based fuzzy matching loop
          const fuzzyResults = workers.filter(worker => {
            const searchTargetText = [
              worker.name,
              worker.role,
              worker.bio,
              worker.category,
              ...(worker.skills || [])
            ].join(' ').toLowerCase();

            // Standard sub-string index check
            if (searchTargetText.includes(finalQuery)) return true;

            // Simple Levenshtein distance / typo handling hook for broken words
            const words = finalQuery.split(/\s+/);
            return words.every(word => {
              if (word.length < 3) return searchTargetText.includes(word);

              // Returns true if a keyword segment closely matches a chunk of profile text
              return searchTargetText.split(/\s+/).some(targetWord => {
                if (targetWord.includes(word) || word.includes(targetWord)) return true;

                // Fallback for single character typos (e.g., 'eletric' vs 'electric')
                let distance = 0;
                for (let i = 0; i < Math.min(word.length, targetWord.length); i++) {
                  if (word[i] !== targetWord[i]) distance++;
                }
                return distance <= 1 && Math.abs(word.length - targetWord.length) <= 1;
              });
            });
          });

          setNearbyWorkers(fuzzyResults);
        }
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

    const SYNONYM_EXTENSIONS = {
      'law': 'Legal',
      'lawyer': 'Legal',
      'lawyers': 'Legal',
      'fintech': 'FinTech',
      'finance': 'FinTech',
      'agritech': 'AgriTech',
      'agriculture': 'AgriTech'
    };

    try {
      // Fetch base providers list safely
      const url = `${API_BASE}/match/nearby`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({ error: "Invalid response from server" }));
      const workers = data.workers || [];

      if (response.ok) {
        const rawInput = (searchText || '').trim();
        const normalizedInput = rawInput.toLowerCase();

        // Standardize search criteria: Append synonym root if matched
        const extendedKeyword = SYNONYM_EXTENSIONS[normalizedInput]
          ? `${rawInput} ${SYNONYM_EXTENSIONS[normalizedInput]}`
          : rawInput;

        const finalQuery = extendedKeyword.toLowerCase();

        if (!rawInput) {
          setNearbyWorkers(workers);
        } else {
          // Implement lightweight, scoring-based fuzzy matching loop
          const fuzzyResults = workers.filter(worker => {
            const searchTargetText = [
              worker.name,
              worker.role,
              worker.bio,
              worker.category,
              ...(worker.skills || [])
            ].join(' ').toLowerCase();

            // Standard sub-string index check
            if (searchTargetText.includes(finalQuery)) return true;

            // Simple Levenshtein distance / typo handling hook for broken words
            const words = finalQuery.split(/\s+/);
            return words.every(word => {
              if (word.length < 3) return searchTargetText.includes(word);
              // Returns true if a keyword segment closely matches a chunk of the profile text
              return searchTargetText.split(/\s+/).some(targetWord => {
                if (targetWord.includes(word) || word.includes(targetWord)) return true;
                // Fallback for single character typos (e.g., 'eletric' vs 'electric')
                let distance = 0;
                for (let i = 0; i < Math.min(word.length, targetWord.length); i++) {
                  if (word[i] !== targetWord[i]) distance++;
                }
                return distance <= 1 && Math.abs(word.length - targetWord.length) <= 1;
              });
            });
          });

          setNearbyWorkers(fuzzyResults);
        }
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
