document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById("reportForm");
  const itemsList = document.getElementById("itemsList");
  const searchInput = document.getElementById("search");
  const imageInput = document.getElementById("image");

  // Create centered, constrained image preview
  const previewContainer = document.createElement("div");
  previewContainer.style.display = "flex";
  previewContainer.style.justifyContent = "center";
  previewContainer.style.alignItems = "center";
  previewContainer.style.overflow = "hidden";
  previewContainer.style.maxWidth = "100%";
  previewContainer.style.maxHeight = "250px";
  previewContainer.style.marginBottom = "1rem";
  previewContainer.style.borderRadius = "12px";
  imageInput.parentNode.insertBefore(previewContainer, imageInput.nextSibling);

  const preview = document.createElement("img");
  preview.style.maxWidth = "100%";
  preview.style.maxHeight = "100%";
  preview.style.cursor = "grab";
  preview.draggable = true;
  previewContainer.appendChild(preview);

  let offsetX = 0, offsetY = 0, startX, startY, scale = 1;
  let isDragging = false, initialDistance = null;

  const setTransform = () => {
    preview.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  };

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        offsetX = offsetY = 0;
        scale = 1;
        setTransform();
      };
      reader.readAsDataURL(file);
    } else preview.src = "";
  });

  // Drag (mouse)
  preview.addEventListener("mousedown", e => {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    preview.style.cursor = "grabbing";
  });
  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    setTransform();
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    preview.style.cursor = "grab";
  });

  // Drag & pinch (touch)
  preview.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX - offsetX;
      startY = e.touches[0].clientY - offsetY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDistance = Math.hypot(dx, dy);
    }
  });

  preview.addEventListener("touchmove", e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      offsetX = e.touches[0].clientX - startX;
      offsetY = e.touches[0].clientY - startY;
      setTransform();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      if (initialDistance) {
        scale *= distance / initialDistance;
        scale = Math.min(Math.max(0.5, scale), 3);
        setTransform();
      }
      initialDistance = distance;
    }
  });

  preview.addEventListener("touchend", e => {
    if (e.touches.length < 2) initialDistance = null;
  });

  // Zoom mouse wheel
  preview.addEventListener("wheel", e => {
    e.preventDefault();
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.5, scale), 3);
    setTransform();
  });

  // Fetch & display items
  async function fetchItems() {
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      const items = await res.json();
      displayItems(items);
    } catch (err) {
      console.error("Error fetching items:", err);
      itemsList.innerHTML = "<p>❌ Failed to load items.</p>";
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
        <p style="font-size:0.7rem; opacity:0.5;">
          💧 <a href="https://github.com/ZahikAbasDar" target="_blank" style="color:#fff;">Zahik Abas Dar – CSE Student</a>
        </p>
      `;
      itemsList.appendChild(card);
    });
  }

  // Form submission
  reportForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(reportForm);

    try {
      const res = await fetch("/api/items", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type");

      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Server did not return JSON: " + text);
      }

      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      alert("✅ Item reported successfully!");
      reportForm.reset();
      preview.src = "";
      offsetX = offsetY = 0;
      scale = 1;
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("❌ Error submitting report: " + err.message);
    }
  });

  // Search items
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.toLowerCase();
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items for search");
      const items = await res.json();
      displayItems(items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      ));
    } catch (err) {
      console.error(err);
    }
  });

  // Notify button
  window.notifyMam = () => {
    const message = encodeURIComponent("Hello Ms. Pratibha, I want to report a Lost/Found item.");
    window.open(`https://wa.me/917005799506?text=${message}`, "_blank");
  };

  fetchItems();
});
