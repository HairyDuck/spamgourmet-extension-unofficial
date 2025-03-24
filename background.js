// Background script for Spamgourmet Email Generator

// Track the content script that requested opening the popup
let activeContentScriptRequest = null;

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create a context menu item for email input fields
  chrome.contextMenus.create({
    id: "generateSpamgourmetEmail",
    title: "Generate Spamgourmet email",
    contexts: ["editable"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateSpamgourmetEmail") {
    // Check if we have permissions for the current tab
    chrome.permissions.contains({
      permissions: ["activeTab", "scripting"],
      origins: [tab.url]
    }, (hasPermission) => {
      if (hasPermission) {
        // If we have permissions, show the generator box
        showGeneratorForField(tab);
      } else {
        // If not, request permissions
        requestPermissionsAndShowGenerator(tab);
      }
    });
  }
});

// Function to request permissions and then show generator
function requestPermissionsAndShowGenerator(tab) {
  chrome.permissions.request({
    permissions: ["activeTab", "scripting"],
    origins: [tab.url]
  }, (granted) => {
    if (granted) {
      showGeneratorForField(tab);
    } else {
      // Permission was not granted, show a notification
      chrome.action.setBadgeText({ text: "❌" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 3000);
    }
  });
}

// Function to show the generator box for the active field
function showGeneratorForField(tab) {
  console.log("Showing generator for field in tab:", tab.id);
  
  // First try to get the active field info
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getActiveFieldInfo
  }, (results) => {
    if (chrome.runtime.lastError) {
      console.error("Error executing script:", chrome.runtime.lastError);
      return;
    }
    
    if (!results || !results[0] || !results[0].result) {
      console.warn("No active field found, sending generalized request");
      // If we can't get field info, just send a generic request
      // The content script will try to find a suitable field
      chrome.tabs.sendMessage(tab.id, {
        action: "showGeneratorForField"
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
        }
        
        if (response && !response.success) {
          console.error("Failed to show generator:", response.reason);
        }
      });
      return;
    }

    const fieldInfo = results[0].result;
    console.log("Field info:", fieldInfo);

    // Send message to content script to show generator for this field
    chrome.tabs.sendMessage(tab.id, {
      action: "showGeneratorForField",
      fieldId: fieldInfo.id,
      fieldName: fieldInfo.name
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
      }
      
      if (response && !response.success) {
        console.error("Failed to show generator:", response.reason);
      }
    });
  });
}

// Function to get info about the active field
function getActiveFieldInfo() {
  const activeElement = document.activeElement;
  
  if (!activeElement) {
    console.log("No active element found");
    return null;
  }
  
  console.log("Active element:", activeElement.tagName, activeElement.id, activeElement.name);
  
  if (activeElement.tagName !== 'INPUT') {
    console.log("Active element is not an input");
    return null;
  }
  
  return {
    id: activeElement.id,
    name: activeElement.name,
    type: activeElement.type,
    value: activeElement.value
  };
}

// For legacy support, keep the old function
function generateAndFillEmail(tab) {
  // Get settings from storage
  chrome.storage.sync.get(
    {
      username: '',
      maxEmails: 3,
      blockEmails: true
    },
    (items) => {
      if (!items.username) {
        // If username is not set, show a notification
        chrome.action.setBadgeText({ text: "⚠️" });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 3000);
        return;
      }

      // Execute content script to get the domain name
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getDomainInfo
      }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
          console.error(chrome.runtime.lastError || "No results from script execution");
          return;
        }

        const domainInfo = results[0].result;
        if (!domainInfo) return;

        // Generate a Spamgourmet email address
        const siteName = domainInfo.siteName;
        const uniqueWord = generateUniqueWord(siteName);
        
        // Format email based on blocking setting
        let spamgourmetEmail;
        if (items.blockEmails) {
          // When blocking is enabled, include max emails
          spamgourmetEmail = `${uniqueWord}.${items.maxEmails}.${items.username}@spamgourmet.com`;
        } else {
          // When blocking is disabled, omit the number entirely
          spamgourmetEmail = `${uniqueWord}.${items.username}@spamgourmet.com`;
        }

        // Send message to content script to fill the email
        chrome.tabs.sendMessage(tab.id, {
          action: "fillEmailField",
          email: spamgourmetEmail
        });
      });
    }
  );
}

// Function to get the domain info from the current page
function getDomainInfo() {
  const hostname = window.location.hostname;
  return {
    hostname: hostname,
    siteName: extractMeaningfulSiteName(hostname)
  };
}

// Function to extract a meaningful site name from a hostname
function extractMeaningfulSiteName(hostname) {
  // Remove 'www.' if present
  const domain = hostname.replace(/^www\./, '');
  
  // Split the domain by dots
  const parts = domain.split('.');
  
  // Common subdomains to ignore
  const commonSubdomains = ['my', 'app', 'mail', 'login', 'account', 'portal', 'dashboard'];
  
  // Simple case: hostname is just example.com
  if (parts.length === 2) {
    return parts[0];
  }
  
  // Handle multi-part domains
  if (parts.length > 2) {
    // If the first part is a common subdomain (like "my"), use the second part
    if (commonSubdomains.includes(parts[0].toLowerCase())) {
      return parts[1];
    }
    
    // Handle country-specific TLDs like .co.uk, .com.au
    const countryCodeTLDs = ['co.uk', 'com.au', 'co.nz', 'co.jp', 'co.in', 'com.br'];
    const lastTwoParts = parts.slice(-2).join('.');
    
    if (countryCodeTLDs.includes(lastTwoParts)) {
      // For example, in example.co.uk, return "example"
      return parts[parts.length - 3];
    }
  }
  
  // Default to the first part if all else fails
  return parts[0];
}

// Function to generate a unique word based on the site name
function generateUniqueWord(siteName) {
  // Start with the site name as a base
  let word = siteName;
  
  // Add a simple uniqueness factor based on current date
  // This isn't cryptographically secure, but good enough for this purpose
  const dateHash = Date.now().toString(36).substring(4, 8);
  
  // Clean up the word (remove special characters, spaces)
  word = word.replace(/[^a-zA-Z0-9]/g, '');
  
  // Generate a unique word by combining site name with the hash
  return `${word}${dateHash}`;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup" && message.source === "content_script") {
    // Store information about the requesting content script
    activeContentScriptRequest = {
      tabId: sender.tab.id,
      targetField: message.targetField
    };
    
    // Open the extension popup
    chrome.action.openPopup();
    sendResponse({ success: true });
  } else if (message.action === "getContentScriptTarget") {
    // Return information about the content script that opened the popup
    if (activeContentScriptRequest) {
      sendResponse(activeContentScriptRequest);
      // Clear after it's been used
      setTimeout(() => {
        activeContentScriptRequest = null;
      }, 5000);
    } else {
      sendResponse(null);
    }
  }
  
  return true; // To enable async response
}); 