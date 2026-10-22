/**
 * LeadHarvest Pro - Content Script
 * Injects floating capture widget and communicates with background service worker.
 */

(function () {
  if (window.__leadHarvestInitialized) return;
  window.__leadHarvestInitialized = true;

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_PAGE_LEAD") {
      try {
        const lead = LeadExtractor.extractFromDocument(document, window.location.href);
        sendResponse({ success: true, lead });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });

  // Inject floating capture button on page
  function injectFloatingWidget() {
    if (document.getElementById("lead-harvest-badge")) return;

    const badge = document.createElement("div");
    badge.id = "lead-harvest-badge";
    badge.innerHTML = `
      <div class="lh-badge-content">
        <span class="lh-badge-icon">⚡</span>
        <span class="lh-badge-text">Capture Lead</span>
      </div>
    `;

    badge.addEventListener("click", () => {
      const lead = LeadExtractor.extractFromDocument(document, window.location.href);
      chrome.runtime.sendMessage({ action: "SAVE_LEAD", lead }, (response) => {
        if (response && response.success) {
          showToast(`✅ Captured: ${lead.name || "Lead"}!`);
        } else if (response && response.alreadyExists) {
          showToast(`ℹ️ Lead already in database!`);
        } else {
          showToast(`⚠️ Failed to save lead`);
        }
      });
    });

    document.body.appendChild(badge);
  }

  function showToast(message) {
    let toast = document.getElementById("lh-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "lh-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "lh-toast-show";
    setTimeout(() => {
      toast.className = "";
    }, 3200);
  }

  // Inject widget after page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectFloatingWidget);
  } else {
    setTimeout(injectFloatingWidget, 1000);
  }
})();
