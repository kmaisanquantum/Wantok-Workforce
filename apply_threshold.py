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

search = """        if (!rawInput) {
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
        }"""

replace = """        if (!rawInput) {
          setNearbyWorkers(workers);
        } else if (rawInput.length < 3) {
          // Guard clause for short inputs (< 3 chars): Strict prefix matching only
          const strictShortResults = workers.filter(worker => {
            return (
              (worker.name || '').toLowerCase().startsWith(normalizedInput) ||
              (worker.role || '').toLowerCase().startsWith(normalizedInput) ||
              (worker.category || '').toLowerCase().startsWith(normalizedInput)
            );
          });
          setNearbyWorkers(strictShortResults);
        } else {
          // Run the deep fuzzy, synonym, and stemming filter when input is 3 or more characters
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
        }"""

apply_patch('WantokWorkforce.js', search, replace)
