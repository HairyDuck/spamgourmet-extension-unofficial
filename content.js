// Content script for Spamgourmet Email Generator

let settings = {
  username: '',
  maxEmails: 3,
  autoDetect: true,
  autoFill: true,
  blockEmails: true
};

// Keep track of any open suggestion boxes
let activeSuggestionBox = null;

// Track if we've already set up the detection
let setupComplete = false;

// Load settings
chrome.storage.sync.get(
  {
    username: '',
    maxEmails: 3,
    autoDetect: true,
    autoFill: true,
    blockEmails: true
  },
  (items) => {
    settings = items;
    // Check if we have permission before auto-detecting
    setupDetection();
  }
);

// Set up detection regardless of permissions
function setupDetection() {
  // Prevent multiple setups
  if (setupComplete) return;
  setupComplete = true;
  
  console.log("Spamgourmet: Setting up email field detection");
  
  // Add document-level click handler to catch all potential email field clicks
  document.addEventListener('click', handleDocumentClick);
  
  // Check for permission if autoDetect is enabled
  if (settings.autoDetect) {
    chrome.permissions.contains({
      permissions: ["activeTab", "scripting"],
      origins: [window.location.origin + "/*"]
    }, (hasPermission) => {
      if (hasPermission) {
        detectEmailFields();
      } else {
        // Even without full permissions, we'll add click event listeners to email fields
        detectEmailFieldsWithoutPermission();
      }
    });
  } else {
    // Even without auto-detect, add basic click listeners
    detectEmailFieldsWithoutPermission();
  }
  
  // Set up mutation observer to handle dynamically added fields
  setupMutationObserver();
}

// Document-level click handler to catch all email field clicks
function handleDocumentClick(event) {
  // Check if we clicked on an input
  if (event.target && event.target.tagName === 'INPUT') {
    const input = event.target;
    
    // Check if it's an email field
    if (isEmailField(input)) {
      console.log("Spamgourmet: Detected click on email field");
      
      // Add detection marker if not already present
      if (!input.dataset.spamgourmetDetected) {
        input.dataset.spamgourmetDetected = 'true';
        
        // Add click event listener explicitly
        input.addEventListener('click', handleEmailFieldClick);
      }
      
      // Always handle the click directly too
      handleEmailFieldClick(event);
    }
  }
}

// Function to observe DOM changes and detect new email fields
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldDetect = false;
    
    // Check if any nodes were added
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldDetect = true;
      }
    });
    
    // If nodes were added, check for new email fields
    if (shouldDetect) {
      if (settings.autoDetect) {
        chrome.permissions.contains({
          permissions: ["activeTab", "scripting"],
          origins: [window.location.origin + "/*"]
        }, (hasPermission) => {
          if (hasPermission) {
            detectNewEmailFields();
          } else {
            detectNewEmailFieldsWithoutPermission();
          }
        });
      } else {
        detectNewEmailFieldsWithoutPermission();
      }
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Function to detect new email fields without changing existing ones
function detectNewEmailFields() {
  const inputFields = document.querySelectorAll('input:not([data-spamgourmet-detected])');
  
  inputFields.forEach((input) => {
    if (isEmailField(input)) {
      // Add event listeners
      input.addEventListener('focus', handleEmailFieldFocus);
      input.addEventListener('click', handleEmailFieldClick);
      
      // Mark as detected
      input.dataset.spamgourmetDetected = 'true';
      
      // If auto-fill is enabled, generate and insert the email directly
      if (settings.autoFill && settings.username) {
        generateAndFillEmail(input);
      }
    }
  });
}

// Function to detect new email fields without full permissions
function detectNewEmailFieldsWithoutPermission() {
  const inputFields = document.querySelectorAll('input:not([data-spamgourmet-detected])');
  
  inputFields.forEach((input) => {
    if (isEmailField(input)) {
      // Add click event listener
      input.addEventListener('click', handleEmailFieldClick);
      
      // Mark as detected
      input.dataset.spamgourmetDetected = 'true';
    }
  });
}

// Listen for changes to settings
chrome.storage.onChanged.addListener((changes) => {
  for (let key in changes) {
    settings[key] = changes[key].newValue;
  }
  
  // If autoDetect or username changed, check permission and detect again
  if (changes.autoDetect || changes.username) {
    setupDetection();
  }
});

// Helper function to check if an input is an email field
function isEmailField(input) {
  return (
    input.type === 'email' || 
    (input.name && input.name.toLowerCase().includes('email')) ||
    (input.id && input.id.toLowerCase().includes('email')) ||
    (input.placeholder && input.placeholder.toLowerCase().includes('email')) ||
    input.autocomplete === 'email'
  );
}

// Function to detect email input fields without full permissions
function detectEmailFieldsWithoutPermission() {
  console.log("Spamgourmet: Setting up basic click detection for email fields");
  
  // Find all input fields
  const inputFields = document.querySelectorAll('input');
  
  inputFields.forEach((input) => {
    // Check if field is likely an email field
    if (isEmailField(input)) {
      console.log("Spamgourmet: Email field detected:", input);
      
      // Add click event listener
      input.addEventListener('click', handleEmailFieldClick);
      
      // Mark as detected
      input.dataset.spamgourmetDetected = 'true';
    }
  });
}

// Function to detect email input fields with full permissions
function detectEmailFields() {
  console.log("Spamgourmet: Setting up full detection for email fields");
  
  // Find all input fields
  const inputFields = document.querySelectorAll('input');
  
  inputFields.forEach((input) => {
    // Check if field is likely an email field
    if (isEmailField(input)) {
      console.log("Spamgourmet: Email field detected with full permissions:", input);
      
      // Add event listeners
      input.addEventListener('focus', handleEmailFieldFocus);
      input.addEventListener('click', handleEmailFieldClick);
      
      // Mark as detected
      input.dataset.spamgourmetDetected = 'true';
      
      // If auto-fill is enabled, generate and insert the email directly
      if (settings.autoFill && settings.username) {
        generateAndFillEmail(input);
      }
    }
  });
}

// Function to handle email field click event
function handleEmailFieldClick(event) {
  console.log("Spamgourmet: Email field clicked");
  const input = event.target;
  
  // Only show generator if we have a username
  if (!settings.username) {
    console.log("Spamgourmet: No username set, not showing generator");
    return;
  }
  
  // Close any existing suggestion box
  if (activeSuggestionBox) {
    activeSuggestionBox.remove();
    activeSuggestionBox = null;
  }
  
  console.log("Spamgourmet: Creating generator box");
  createGeneratorBox(input);
}

// Function to handle email field focus
function handleEmailFieldFocus(event) {
  const input = event.target;
  
  // Only show generator if we have a username
  if (!settings.username) {
    return;
  }
  
  // Close any existing suggestion box
  if (activeSuggestionBox) {
    activeSuggestionBox.remove();
    activeSuggestionBox = null;
  }
  
  // Show the suggestion tooltip
  createSuggestionTooltip(input);
}

// Function to create generator box below the email field
function createGeneratorBox(inputField) {
  // Get field position
  const rect = inputField.getBoundingClientRect();
  
  // Create the generator box
  const generatorBox = document.createElement('div');
  generatorBox.className = 'spamgourmet-generator-box';
  generatorBox.style.position = 'absolute';
  generatorBox.style.left = `${rect.left}px`;
  generatorBox.style.top = `${rect.bottom + window.scrollY + 2}px`;
  generatorBox.style.width = `${rect.width < 280 ? 280 : rect.width}px`;
  generatorBox.style.zIndex = '10000000'; // Very high z-index to ensure visibility
  generatorBox.style.backgroundColor = '#ffffff';
  generatorBox.style.border = '1px solid #4CAF50';
  generatorBox.style.borderRadius = '4px';
  generatorBox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  generatorBox.style.padding = '10px';
  generatorBox.style.fontFamily = 'Arial, sans-serif';
  generatorBox.style.fontSize = '14px';
  
  // Generate Spamgourmet email
  const spamgourmetEmail = generateSpamgourmetEmail();
  
  // Set content for the generator box
  generatorBox.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold; color: #4CAF50;">
      Generate Spamgourmet Email
    </div>
    <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-family: monospace; overflow-wrap: break-word;">
      ${spamgourmetEmail}
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="sg-use" style="flex: 1; padding: 6px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Use This
      </button>
      <button id="sg-custom" style="padding: 6px 12px; background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
        Customize
      </button>
      <button id="sg-cancel" style="padding: 6px 12px; background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
        Cancel
      </button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(generatorBox);
  
  // Keep track of this box
  activeSuggestionBox = generatorBox;
  
  // Add event listeners for buttons
  const useButton = generatorBox.querySelector('#sg-use');
  if (useButton) {
    useButton.addEventListener('click', () => {
      console.log("Spamgourmet: Using email:", spamgourmetEmail);
      inputField.value = spamgourmetEmail;
      
      // We no longer set the spamgourmetFilled flag permanently
      // This allows the generator to be shown again later
      // inputField.dataset.spamgourmetFilled = 'true';
      
      // Trigger input events
      const inputEvent = new Event('input', { bubbles: true });
      inputField.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      inputField.dispatchEvent(changeEvent);
      
      // Remove the generator box
      generatorBox.remove();
      activeSuggestionBox = null;
    });
  }
  
  const customButton = generatorBox.querySelector('#sg-custom');
  if (customButton) {
    customButton.addEventListener('click', () => {
      console.log("Spamgourmet: Opening extension popup for customization");
      
      // Open the extension popup
      chrome.runtime.sendMessage({ 
        action: "openPopup",
        source: "content_script",
        targetField: inputField.id || inputField.name || "email-field"
      });
      
      // Remove the generator box
      generatorBox.remove();
      activeSuggestionBox = null;
    });
  }
  
  const cancelButton = generatorBox.querySelector('#sg-cancel');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      generatorBox.remove();
      activeSuggestionBox = null;
    });
  }
  
  // Close when clicking outside
  const handleOutsideClick = function(e) {
    if (!generatorBox.contains(e.target) && e.target !== inputField) {
      generatorBox.remove();
      activeSuggestionBox = null;
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  
  // Use setTimeout to avoid immediate triggering from the current click
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);
}

// Function to create suggestion tooltip
function createSuggestionTooltip(inputField) {
  // Create tooltip container
  const tooltip = document.createElement('div');
  tooltip.className = 'spamgourmet-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.zIndex = '10000000'; // Match z-index of the generator box
  tooltip.style.backgroundColor = '#fff';
  tooltip.style.border = '1px solid #ccc';
  tooltip.style.borderRadius = '4px';
  tooltip.style.padding = '8px';
  tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  tooltip.style.fontSize = '14px';
  tooltip.style.fontFamily = 'Arial, sans-serif';
  tooltip.style.lineHeight = '1.4';
  tooltip.style.width = '280px';
  
  // Position the tooltip
  const rect = inputField.getBoundingClientRect();
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
  
  // Generate Spamgourmet email
  const spamgourmetEmail = generateSpamgourmetEmail();
  
  // Set tooltip content
  tooltip.innerHTML = `
    <p style="margin: 0 0 8px 0; font-weight: bold;">Use Spamgourmet address?</p>
    <div style="background-color: #f5f5f5; padding: 5px; border-radius: 3px; margin-bottom: 8px; font-family: monospace;">${spamgourmetEmail}</div>
    <div style="display: flex; gap: 5px;">
      <button id="sgfill" style="flex: 1; padding: 5px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 3px;">Use this</button>
      <button id="sgcancel" style="flex: 1; padding: 5px; cursor: pointer; background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 3px;">Cancel</button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(tooltip);
  
  // Keep track of this box
  activeSuggestionBox = tooltip;
  
  // Add event listeners
  const fillButton = tooltip.querySelector('#sgfill');
  if (fillButton) {
    fillButton.addEventListener('click', () => {
      inputField.value = spamgourmetEmail;
      
      // We no longer set the spamgourmetFilled flag permanently
      // This allows the tooltip to be shown again later
      // inputField.dataset.spamgourmetFilled = 'true';
      
      tooltip.remove();
      activeSuggestionBox = null;
      
      // Dispatch input event to trigger validation
      const event = new Event('input', { bubbles: true });
      inputField.dispatchEvent(event);
      
      // Dispatch change event to trigger validation
      const changeEvent = new Event('change', { bubbles: true });
      inputField.dispatchEvent(changeEvent);
    });
  }
  
  const cancelButton = tooltip.querySelector('#sgcancel');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      tooltip.remove();
      activeSuggestionBox = null;
    });
  }
  
  // Close when clicking outside
  const handleOutsideClick = function(e) {
    if (!tooltip.contains(e.target) && e.target !== inputField) {
      tooltip.remove();
      activeSuggestionBox = null;
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  
  // Use setTimeout to avoid immediate triggering
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);
}

// Function to generate Spamgourmet email based on current site
function generateSpamgourmetEmail() {
  // Extract meaningful site name from current URL
  const siteName = extractMeaningfulSiteName(window.location.hostname);
  
  // Generate a unique word based on the site name
  const uniqueWord = generateUniqueWord(siteName);
  
  // Format the email address based on blocking setting
  if (settings.blockEmails) {
    // When blocking is enabled, include max emails
    return `${uniqueWord}.${settings.maxEmails}.${settings.username}@spamgourmet.com`;
  } else {
    // When blocking is disabled, omit the number entirely
    return `${uniqueWord}.${settings.username}@spamgourmet.com`;
  }
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

// Function to generate and fill an email address
function generateAndFillEmail(inputField) {
  if (!inputField.value) {
    // Get the Spamgourmet email
    const email = generateSpamgourmetEmail();
    
    // Fill the input field
    inputField.value = email;
    
    // We no longer set the spamgourmetFilled flag permanently
    // This allows the generator to be shown again later
    // inputField.dataset.spamgourmetFilled = 'true';
    
    // Dispatch events to trigger validation
    const event = new Event('input', { bubbles: true });
    inputField.dispatchEvent(event);
    
    const changeEvent = new Event('change', { bubbles: true });
    inputField.dispatchEvent(changeEvent);
  }
}

// Run the detection when page loads completely
window.addEventListener('load', () => {
  console.log("Spamgourmet: Page load event fired");
  setupDetection();
});

// Also run it now, for pages that might be already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log("Spamgourmet: Page already loaded, setting up detection");
  setTimeout(setupDetection, 500);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fillEmailField" && message.email) {
    // Find email field either by ID, name, or use the focused element
    let targetField = document.activeElement;
    
    // If the message contains a target field ID or name, try to find it
    if (message.targetField) {
      const fieldById = document.getElementById(message.targetField);
      const fieldByName = document.querySelector(`[name="${message.targetField}"]`);
      if (fieldById) {
        targetField = fieldById;
      } else if (fieldByName) {
        targetField = fieldByName;
      }
    }
    
    // Check if it's an input field
    if (targetField && targetField.tagName === 'INPUT') {
      console.log("Spamgourmet: Filling email field with:", message.email);
      
      // Fill the field with the email
      targetField.value = message.email;
      targetField.dataset.spamgourmetFilled = 'true';
      
      // Dispatch events to trigger validation
      const event = new Event('input', { bubbles: true });
      targetField.dispatchEvent(event);
      
      const changeEvent = new Event('change', { bubbles: true });
      targetField.dispatchEvent(changeEvent);
      
      sendResponse({ success: true });
    } else {
      console.log("Spamgourmet: No email input field found to fill");
      sendResponse({ success: false, reason: "No input field focused" });
    }
  } else if (message.action === "showGeneratorForField") {
    console.log("Spamgourmet: Received request to show generator for field:", message.fieldId, message.fieldName);
    
    // Try to find the field using various methods
    const inputField = document.getElementById(message.fieldId) || 
                        document.querySelector(`[name="${message.fieldName}"]`) || 
                        document.activeElement;
    
    if (inputField && inputField.tagName === 'INPUT') {
      console.log("Spamgourmet: Found field for generator:", inputField);
      
      // Close any existing suggestion box
      if (activeSuggestionBox) {
        activeSuggestionBox.remove();
        activeSuggestionBox = null;
      }
      
      // Show generator box for this field
      console.log("Spamgourmet: Showing generator from context menu");
      createGeneratorBox(inputField);
      sendResponse({ success: true });
    } else {
      console.log("Spamgourmet: Email field not found for generator");
      sendResponse({ success: false, reason: "Email field not found" });
    }
  }
  return true; // To enable async response
}); 