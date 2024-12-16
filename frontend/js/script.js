async function fetchNPC() {
    const outputDiv = document.getElementById("output");
    outputDiv.textContent = "Generating NPC...";
  
    try {
      // Fetch data from the Perchance generator API
      const response = await fetch("https://perchance.org/npcrandomgenerator");
      if (!response.ok) {
        throw new Error("Failed to fetch NPC data");
      }
  
      // Parse the HTML response
      const text = await response.text();
  
      // Display the raw HTML content from Perchance
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const result = doc.querySelector(".output");
  
      // Update the output with generated data
      outputDiv.innerHTML = result ? result.innerHTML : "No data found!";
    } catch (error) {
      outputDiv.textContent = `Error: ${error.message}`;
    }
  }
  
  document.getElementById("generate").addEventListener("click", fetchNPC);