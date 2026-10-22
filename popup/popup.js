/**
 * LeadHarvest Pro - Popup Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const tabs = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const statsCounter = document.getElementById("stats-counter");
  const leadsCountTab = document.getElementById("leads-count-tab");

  // Tab 1 Elements
  const btnDetectLead = document.getElementById("btn-detect-lead");
  const capturePreview = document.getElementById("capture-preview");
  const detectedSourceTag = document.getElementById("detected-source-tag");
  const prevName = document.getElementById("prev-name");
  const prevHeadline = document.getElementById("prev-headline");
  const prevCompany = document.getElementById("prev-company");
  const prevLocation = document.getElementById("prev-location");
  const prevEmail = document.getElementById("prev-email");
  const prevPhone = document.getElementById("prev-phone");
  const btnSaveDetected = document.getElementById("btn-save-detected");

  // Tab 2 Elements
  const leadSearchInput = document.getElementById("lead-search-input");
  const leadsListContainer = document.getElementById("leads-list-container");
  const btnExportCsv = document.getElementById("btn-export-csv");
  const btnExportJson = document.getElementById("btn-export-json");
  const btnClearLeads = document.getElementById("btn-clear-leads");

  // Tab 3 Elements
  const webhookUrlInput = document.getElementById("webhook-url-input");
  const btnSaveWebhook = document.getElementById("btn-save-webhook");
  const btnTestWebhook = document.getElementById("btn-test-webhook");
  const webhookStatus = document.getElementById("webhook-status");

  const popupToast = document.getElementById("popup-toast");

  let currentDetectedLead = null;
  let allLeads = [];

  // --- TAB NAVIGATION ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");

      if (targetId === "tab-leads") {
        renderLeadsList();
      }
    });
  });

  // --- INITIAL LOAD ---
  loadStorageData();

  function loadStorageData() {
    chrome.storage.local.get(["leads", "webhookUrl"], (result) => {
      allLeads = result.leads || [];
      updateCounts(allLeads.length);
      if (result.webhookUrl) {
        webhookUrlInput.value = result.webhookUrl;
      }
    });
  }

  function updateCounts(count) {
    statsCounter.textContent = `${count} Lead${count === 1 ? "" : "s"}`;
    leadsCountTab.textContent = count;
  }

  function showToast(msg) {
    popupToast.textContent = msg;
    popupToast.classList.add("show");
    setTimeout(() => {
      popupToast.classList.remove("show");
    }, 2800);
  }

  // --- TAB 1: DETECT & CAPTURE ---
  btnDetectLead.addEventListener("click", async () => {
    btnDetectLead.disabled = true;
    btnDetectLead.innerHTML = "<span>⏳ Scanning DOM...</span>";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showToast("No active browser tab found.");
        resetDetectBtn();
        return;
      }

      // Execute extraction on the page
      chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_PAGE_LEAD" }, (response) => {
        resetDetectBtn();

        if (response && response.lead) {
          populatePreview(response.lead);
        } else {
          // If content script wasn't injected yet, inject dynamically
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ["scripts/extractor.js"]
            },
            () => {
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  func: () => LeadExtractor.extractFromDocument(document, window.location.href)
                },
                (results) => {
                  if (results && results[0] && results[0].result) {
                    populatePreview(results[0].result);
                  } else {
                    showToast("Could not detect profile. Try on LinkedIn/GitHub!");
                  }
                }
              );
            }
          );
        }
      });
    } catch (err) {
      resetDetectBtn();
      showToast("Scan error: " + err.message);
    }
  });

  function resetDetectBtn() {
    btnDetectLead.disabled = false;
    btnDetectLead.innerHTML = "<span>🔍 Detect & Capture Lead</span>";
  }

  function populatePreview(lead) {
    currentDetectedLead = lead;
    detectedSourceTag.textContent = lead.source || "Web";
    prevName.value = lead.name || "";
    prevHeadline.value = lead.headline || "";
    prevCompany.value = lead.company || "";
    prevLocation.value = lead.location || "";
    prevEmail.value = lead.email || "";
    prevPhone.value = lead.phone || "";

    capturePreview.classList.remove("hidden");
    showToast("Profile detected!");
  }

  btnSaveDetected.addEventListener("click", () => {
    if (!currentDetectedLead) return;

    // Collect edited values
    const leadToSave = {
      ...currentDetectedLead,
      name: prevName.value.trim() || "Unknown Contact",
      headline: prevHeadline.value.trim(),
      company: prevCompany.value.trim(),
      location: prevLocation.value.trim(),
      email: prevEmail.value.trim(),
      phone: prevPhone.value.trim(),
      capturedAt: new Date().toISOString()
    };

    chrome.runtime.sendMessage({ action: "SAVE_LEAD", lead: leadToSave }, (resp) => {
      if (resp && resp.success) {
        showToast("✅ Lead saved to database!");
        capturePreview.classList.add("hidden");
        loadStorageData();
      } else if (resp && resp.alreadyExists) {
        showToast("⚠️ This profile URL already exists in leads!");
      } else {
        showToast("Error saving lead");
      }
    });
  });

  // --- TAB 2: SAVED LEADS & SEARCH ---
  function renderLeadsList() {
    const query = leadSearchInput.value.toLowerCase().trim();
    leadsListContainer.innerHTML = "";

    const filtered = allLeads.filter((l) => {
      return (
        (l.name && l.name.toLowerCase().includes(query)) ||
        (l.headline && l.headline.toLowerCase().includes(query)) ||
        (l.company && l.company.toLowerCase().includes(query)) ||
        (l.location && l.location.toLowerCase().includes(query)) ||
        (l.email && l.email.toLowerCase().includes(query))
      );
    });

    if (filtered.length === 0) {
      leadsListContainer.innerHTML = `
        <div class="card text-center" style="padding: 24px;">
          <div style="font-size: 24px; margin-bottom: 8px;">📭</div>
          <div style="font-weight: 600; color: #475569;">No leads found</div>
          <div class="text-muted">Capture leads from LinkedIn or web profiles to see them here.</div>
        </div>
      `;
      return;
    }

    filtered.forEach((lead) => {
      const item = document.createElement("div");
      item.className = "lead-item";
      item.innerHTML = `
        <div class="lead-item-top">
          <a href="${lead.profileUrl || '#'}" target="_blank" class="lead-name">${escapeHtml(lead.name || 'Unknown')}</a>
          <span class="source-tag">${escapeHtml(lead.source || 'Web')}</span>
        </div>
        <div class="lead-headline">${escapeHtml(lead.headline || 'No headline available')}</div>
        <div class="lead-meta">
          ${lead.company ? `<span class="lead-meta-pill">🏢 ${escapeHtml(lead.company)}</span>` : ""}
          ${lead.location ? `<span class="lead-meta-pill">📍 ${escapeHtml(lead.location)}</span>` : ""}
          ${lead.email ? `<span class="lead-meta-pill">✉️ ${escapeHtml(lead.email)}</span>` : ""}
          ${lead.phone ? `<span class="lead-meta-pill">📞 ${escapeHtml(lead.phone)}</span>` : ""}
        </div>
        <div class="lead-actions">
          <button class="btn btn-sm btn-outline btn-copy-lead" data-id="${lead.id}">📋 Copy</button>
          <button class="btn btn-sm btn-danger-outline btn-del-lead" data-id="${lead.id}">🗑️</button>
        </div>
      `;

      item.querySelector(".btn-copy-lead").addEventListener("click", () => {
        copyLeadToClipboard(lead);
      });

      item.querySelector(".btn-del-lead").addEventListener("click", () => {
        deleteLead(lead.id);
      });

      leadsListContainer.appendChild(item);
    });
  }

  leadSearchInput.addEventListener("input", renderLeadsList);

  function copyLeadToClipboard(lead) {
    const text = `${lead.name} | ${lead.headline || ""} | ${lead.company || ""} | ${lead.email || ""} | ${lead.profileUrl || ""}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied lead to clipboard!");
    });
  }

  function deleteLead(leadId) {
    allLeads = allLeads.filter((l) => l.id !== leadId);
    chrome.storage.local.set({ leads: allLeads }, () => {
      updateCounts(allLeads.length);
      renderLeadsList();
      showToast("Lead removed");
    });
  }

  btnClearLeads.addEventListener("click", () => {
    if (allLeads.length === 0) return;
    if (confirm("Are you sure you want to delete all saved leads?")) {
      allLeads = [];
      chrome.storage.local.set({ leads: [] }, () => {
        updateCounts(0);
        renderLeadsList();
        showToast("All leads cleared");
      });
    }
  });

  // --- CSV / JSON EXPORT ---
  btnExportCsv.addEventListener("click", () => {
    if (allLeads.length === 0) {
      showToast("No leads to export.");
      return;
    }
    exportToCsv(allLeads);
  });

  btnExportJson.addEventListener("click", () => {
    if (allLeads.length === 0) {
      showToast("No leads to export.");
      return;
    }
    exportToJson(allLeads);
  });

  function exportToCsv(leads) {
    const headers = ["Name", "Headline", "Company", "Location", "Email", "Phone", "Profile URL", "Source", "Captured At"];
    const rows = leads.map((l) => [
      escapeCsv(l.name),
      escapeCsv(l.headline),
      escapeCsv(l.company),
      escapeCsv(l.location),
      escapeCsv(l.email),
      escapeCsv(l.phone),
      escapeCsv(l.profileUrl),
      escapeCsv(l.source),
      escapeCsv(l.capturedAt)
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    downloadFile(csvContent, `leads_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
    showToast("CSV export downloaded!");
  }

  function exportToJson(leads) {
    const jsonStr = JSON.stringify(leads, null, 2);
    downloadFile(jsonStr, `leads_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    showToast("JSON export downloaded!");
  }

  function escapeCsv(val) {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- TAB 3: WEBHOOK SETTINGS ---
  btnSaveWebhook.addEventListener("click", () => {
    const url = webhookUrlInput.value.trim();
    chrome.storage.local.set({ webhookUrl: url }, () => {
      webhookStatus.textContent = "✅ Webhook URL saved successfully!";
      webhookStatus.style.color = "#16a34a";
      showToast("Webhook saved!");
    });
  });

  btnTestWebhook.addEventListener("click", async () => {
    const url = webhookUrlInput.value.trim();
    if (!url) {
      showToast("Please enter a webhook URL first.");
      return;
    }

    webhookStatus.textContent = "⏳ Testing ping to webhook...";
    webhookStatus.style.color = "#2563eb";

    const testLead = {
      id: "test_" + Date.now(),
      name: "Test Lead",
      headline: "CEO at Acme Corp",
      company: "Acme Corp",
      location: "San Francisco, CA",
      email: "test@example.com",
      phone: "+1 555-0199",
      profileUrl: "https://example.com/test",
      source: "LeadHarvest Test Ping",
      capturedAt: new Date().toISOString()
    };

    chrome.runtime.sendMessage({ action: "TRIGGER_WEBHOOK", lead: testLead }, (res) => {
      if (res && res.success) {
        webhookStatus.textContent = `✅ Ping successful! Status: ${res.status}`;
        webhookStatus.style.color = "#16a34a";
        showToast("Webhook test passed!");
      } else {
        webhookStatus.textContent = `❌ Ping failed: ${res?.error || res?.reason || 'Unknown error'}`;
        webhookStatus.style.color = "#dc2626";
      }
    });
  });

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
