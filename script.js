document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById("reportForm");
  const itemsList = document.getElementById("itemsList");
  const searchInput = document.getElementById("search");

  // Fetch & display items
  async function fetchItems() {
    try {
      const res = await fetch("/api/items");
      const items = await res.json();
      displayItems(items);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  }

  function displayItems(items) {
    itemsList.innerHTML = "";
    if (!items.length) return itemsList.innerHTML = "<p>No items reported yet.</p>";
    
    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="Item Image">` : ""}
        <h3>${item.category}</h3>
        <p><strong>Name:</strong> ${item.name}</p>
        <p><strong>Course:</strong> ${item.course}</p>
        <p><strong>Contact:</strong> ${item.contact}</p>
        <p><strong>Description:</strong> ${item.description}</p>
        <p><strong>Status:</strong> ${item.status}</p>
        <p><em>${item.date}</em></p>
      `;
      itemsList.appendChild(card);
    });
  }

  // Form submission
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(reportForm);

    try {
      const res = await fetch("/api/items", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to submit report");
      alert("✅ Item reported successfully!");
      reportForm.reset();
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("❌ Error submitting report");
    }
  });

  // Search items
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.toLowerCase();
    const res = await fetch("/api/items");
    const items = await res.json();
    displayItems(items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    ));
  });

  // Notify button
  window.notifyMam = () => {
    const message = encodeURIComponent("Hello Ms. Pratibha, I want to report a Lost/Found item.");
    window.open(`https://wa.me/917005799506?text=${message}`, "_blank");
  };

  // Initial fetch
  fetchItems();
});
