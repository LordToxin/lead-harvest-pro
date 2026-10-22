/**
 * LeadHarvest Pro - Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default storage
  chrome.storage.local.get(["leads", "webhookUrl"], (result) => {
    if (!result.leads) {
      chrome.storage.local.set({ leads: [] });
    }
  });

  // Create context menu
  chrome.contextMenus.create({
    id: "lh-capture-context",
    title: "⚡ LeadHarvest: Capture Current Page Lead",
    contexts: ["page"]
  });

  updateBadge();
});

// Update extension icon badge with total leads count
function updateBadge() {
  chrome.storage.local.get(["leads"], (result) => {
    const leads = result.leads || [];
    const count = leads.length > 0 ? leads.length.toString() : "";
    chrome.action.setBadgeText({ text: count });
    chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "lh-capture-context" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_PAGE_LEAD" }, (response) => {
      if (response && response.lead) {
        saveLead(response.lead);
      }
    });
  }
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SAVE_LEAD") {
    saveLead(request.lead).then((result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "TRIGGER_WEBHOOK") {
    forwardToWebhook(request.lead).then((res) => {
      sendResponse(res);
    });
    return true;
  }
});

async function saveLead(lead) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["leads", "webhookUrl"], async (result) => {
      const leads = result.leads || [];

      // Check duplicate by profileUrl
      const exists = leads.some((l) => l.profileUrl && lead.profileUrl && l.profileUrl === lead.profileUrl);
      if (exists) {
        resolve({ success: false, alreadyExists: true });
        return;
      }

      leads.unshift(lead);
      chrome.storage.local.set({ leads }, async () => {
        updateBadge();

        // Optional Webhook sync
        if (result.webhookUrl) {
          try {
            await forwardToWebhook(lead, result.webhookUrl);
          } catch (e) {
            console.warn("Webhook dispatch failed:", e);
          }
        }

        resolve({ success: true, count: leads.length });
      });
    });
  });
}

async function forwardToWebhook(lead, webhookUrl = null) {
  if (!webhookUrl) {
    const res = await chrome.storage.local.get(["webhookUrl"]);
    webhookUrl = res.webhookUrl;
  }
  if (!webhookUrl) return { success: false, reason: "No webhook configured" };

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.captured",
        timestamp: new Date().toISOString(),
        data: lead
      })
    });
    return { success: resp.ok, status: resp.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
