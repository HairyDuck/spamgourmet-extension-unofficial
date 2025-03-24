document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const maxEmailsInput = document.getElementById('max-emails');
  const autoDetectCheckbox = document.getElementById('auto-detect');
  const autoFillCheckbox = document.getElementById('auto-fill');
  const saveButton = document.getElementById('save-settings');
  const statusDiv = document.getElementById('status');
  const emailPreview = document.getElementById('email-preview');
  const copyEmailButton = document.getElementById('copy-email');
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const copySuccessDiv = document.getElementById('copy-success');
  const allSitesPermissionButton = document.getElementById('all-sites-permission');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const useEmailButton = document.getElementById('use-email');
  
  // New customization elements
  const customPrefixInput = document.getElementById('custom-prefix');
  const customEmailsInput = document.getElementById('custom-emails');
  const customUsernameInput = document.getElementById('custom-username');
  const resetEmailButton = document.getElementById('reset-email');
  const emailSlider = document.getElementById('email-slider');
  const sliderValue = document.getElementById('slider-value');
  const blockingToggle = document.getElementById('blocking-toggle');
  
  // Track if we have an active field to send email back to
  let activeRequestDetails = null;
  
  // Track the original generated email parts for reset functionality
  let originalEmailParts = {
    prefix: '',
    emails: 3,
    username: ''
  };
  
  // Track if we're using a custom email
  let usingCustomEmail = false;

  // Setup Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and its content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');

      // Special handling for generator tab - refresh email preview
      if (tabName === 'generator') {
        if (!usingCustomEmail) {
          updateSiteSpecificEmailPreview();
        }
      }
    });
  });

  // Load saved settings
  chrome.storage.sync.get(
    {
      username: '',
      maxEmails: 3,
      autoDetect: true,
      autoFill: true,
      blockEmails: true
    },
    (items) => {
      usernameInput.value = items.username;
      maxEmailsInput.value = items.maxEmails;
      autoDetectCheckbox.checked = items.autoDetect;
      autoFillCheckbox.checked = items.autoFill;
      blockingToggle.checked = items.blockEmails !== false; // Default to true if not set
      
      // Set up custom username fields
      customUsernameInput.value = items.username;
      emailSlider.value = items.maxEmails;
      sliderValue.textContent = items.maxEmails;
      
      updateSiteSpecificEmailPreview();
      updatePermissionButton();
      
      // Check if popup was opened via "Customize" button in content script
      chrome.runtime.sendMessage({ action: "getContentScriptTarget" }, (response) => {
        if (response && response.targetField) {
          // Store the active field details
          activeRequestDetails = {
            tabId: response.tabId,
            targetField: response.targetField
          };
          
          // Switch to generator tab
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          document.querySelector('[data-tab="generator"]').classList.add('active');
          document.getElementById('generator-tab').classList.add('active');
          
          // Show the "Use Email" button
          if (useEmailButton) {
            useEmailButton.style.display = 'block';
          }
        }
      });
    }
  );

  // Save settings
  saveButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const maxEmails = parseInt(maxEmailsInput.value, 10);
    const autoDetect = autoDetectCheckbox.checked;
    const autoFill = autoFillCheckbox.checked;

    if (!username) {
      showStatus('Please enter your Spamgourmet username', 'error');
      return;
    }

    if (isNaN(maxEmails) || maxEmails < 1 || maxEmails > 20) {
      showStatus('Max emails must be between 1 and 20', 'error');
      return;
    }

    chrome.storage.sync.set(
      {
        username: username,
        maxEmails: maxEmails,
        autoDetect: autoDetect,
        autoFill: autoFill,
        blockEmails: blockingToggle.checked
      },
      () => {
        showStatus('Settings saved!', 'success');
        
        // Update the custom username field to match
        customUsernameInput.value = username;
        
        // Reset to default generated email
        usingCustomEmail = false;
        
        // Update the preview with the new settings
        updateSiteSpecificEmailPreview();
        
        // Switch to the generator tab to show the updated email
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="generator"]').classList.add('active');
        document.getElementById('generator-tab').classList.add('active');
      }
    );
  });

  // Update preview when inputs change
  usernameInput.addEventListener('input', updateDefaultEmailPreview);
  maxEmailsInput.addEventListener('input', updateDefaultEmailPreview);
  
  // Update custom email when fields change
  customPrefixInput.addEventListener('input', updateCustomEmail);
  customEmailsInput.addEventListener('input', updateCustomEmail);
  
  // Reset to default generated email
  resetEmailButton.addEventListener('click', () => {
    usingCustomEmail = false;
    
    // Clear custom inputs
    customPrefixInput.value = originalEmailParts.prefix;
    customEmailsInput.value = originalEmailParts.emails;
    
    // Reset the slider
    emailSlider.value = originalEmailParts.emails;
    sliderValue.textContent = originalEmailParts.emails;
    
    // Update the preview
    updateSiteSpecificEmailPreview();
    
    showStatus('Email reset to default', 'success');
  });
  
  // Handle slider changes
  emailSlider.addEventListener('input', () => {
    const value = emailSlider.value;
    sliderValue.textContent = value;
    customEmailsInput.value = value;
    updateCustomEmail();
  });
  
  // Handle blocking toggle changes
  blockingToggle.addEventListener('change', () => {
    // Show/hide the slider based on blocking toggle
    const sliderRow = document.querySelector('.slider-row');
    if (sliderRow) {
      sliderRow.style.display = blockingToggle.checked ? 'flex' : 'none';
    }
    
    // If blocking is disabled, use empty string instead of 0
    if (!blockingToggle.checked) {
      customEmailsInput.value = '';
    } else {
      customEmailsInput.value = emailSlider.value;
    }
    
    updateCustomEmail();
    
    // Save the preference
    chrome.storage.sync.set({ blockEmails: blockingToggle.checked });
  });

  // Use email in original field (if we came from content script)
  if (useEmailButton) {
    useEmailButton.addEventListener('click', () => {
      const emailText = emailPreview.textContent;
      
      if (activeRequestDetails) {
        // Send the email back to the content script
        chrome.tabs.sendMessage(
          activeRequestDetails.tabId, 
          {
            action: "fillEmailField",
            email: emailText,
            targetField: activeRequestDetails.targetField
          },
          (response) => {
            if (response && response.success) {
              // Show success message
              showStatus('Email applied to field', 'success');
              
              // Close the popup after a brief delay
              setTimeout(() => {
                window.close();
              }, 1000);
            } else {
              showStatus('Failed to apply email', 'error');
            }
          }
        );
      } else {
        showStatus('No target field available', 'error');
      }
    });
  }

  // Copy email to clipboard (for both buttons)
  function copyEmailToClipboard() {
    const emailText = emailPreview.textContent;
    
    // Use the clipboard API to copy text
    navigator.clipboard.writeText(emailText).then(() => {
      // Show success message
      copySuccessDiv.classList.add('show');
      setTimeout(() => {
        copySuccessDiv.classList.remove('show');
      }, 1500);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      showStatus('Failed to copy to clipboard', 'error');
    });
  }
  
  // Add event listener to both copy buttons
  if (copyEmailButton) {
    copyEmailButton.addEventListener('click', copyEmailToClipboard);
  }
  
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', copyEmailToClipboard);
  }

  // Handle permission button
  allSitesPermissionButton.addEventListener('click', () => {
    // Check if we already have permissions
    chrome.permissions.contains({
      permissions: ["activeTab", "scripting"],
      origins: ["<all_urls>"]
    }, (hasPermission) => {
      if (hasPermission) {
        // If we already have permission, remove it
        chrome.permissions.remove({
          permissions: ["activeTab", "scripting"],
          origins: ["<all_urls>"]
        }, (removed) => {
          if (removed) {
            showStatus('All-sites permissions removed', 'success');
            updatePermissionButton();
          } else {
            showStatus('Failed to remove permissions', 'error');
          }
        });
      } else {
        // If we don't have permission, request it
        chrome.permissions.request({
          permissions: ["activeTab", "scripting"],
          origins: ["<all_urls>"]
        }, (granted) => {
          if (granted) {
            showStatus('All-sites permissions granted', 'success');
            updatePermissionButton();
          } else {
            showStatus('Permissions not granted', 'error');
          }
        });
      }
    });
  });
  
  // Update custom email based on inputs
  function updateCustomEmail() {
    usingCustomEmail = true;
    
    const prefix = customPrefixInput.value.trim() || originalEmailParts.prefix;
    const username = customUsernameInput.value;
    
    // Generate email format based on blocking toggle
    let customEmail;
    if (blockingToggle.checked) {
      // When blocking is enabled, include the number of emails
      const emails = customEmailsInput.value.trim() || emailSlider.value;
      customEmail = `${prefix}.${emails}.${username}@spamgourmet.com`;
    } else {
      // When blocking is disabled, omit the number entirely
      customEmail = `${prefix}.${username}@spamgourmet.com`;
    }
    
    emailPreview.textContent = customEmail;
  }

  // Default preview with no site context
  function updateDefaultEmailPreview() {
    const username = usernameInput.value.trim() || 'username';
    const maxEmails = parseInt(maxEmailsInput.value, 10) || 3;
    const sitename = 'sitename';
    
    emailPreview.textContent = `${sitename}.${maxEmails}.${username}@spamgourmet.com`;
  }

  // Update preview with site-specific context
  function updateSiteSpecificEmailPreview() {
    const username = usernameInput.value.trim() || 'username';
    const maxEmails = parseInt(maxEmailsInput.value, 10) || 3;
    
    // Show/hide the slider based on blocking toggle
    const sliderRow = document.querySelector('.slider-row');
    if (sliderRow) {
      sliderRow.style.display = blockingToggle.checked ? 'flex' : 'none';
    }
    
    // Try to get current tab info
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const siteName = extractMeaningfulSiteName(url.hostname);
          
          if (siteName) {
            // Generate a unique word based on the site name
            const uniqueWord = generateUniqueWord(siteName);
            
            // Store the original parts for reset functionality
            originalEmailParts = {
              prefix: uniqueWord,
              emails: maxEmails,
              username: username
            };
            
            // Update the custom fields to match the generated email
            customPrefixInput.value = uniqueWord;
            customEmailsInput.value = blockingToggle.checked ? maxEmails : '';
            customUsernameInput.value = username;
            
            // Update the slider to match
            emailSlider.value = maxEmails;
            sliderValue.textContent = maxEmails;
            
            // Create email address with or without the number based on blocking setting
            let emailAddress;
            if (blockingToggle.checked) {
              emailAddress = `${uniqueWord}.${maxEmails}.${username}@spamgourmet.com`;
            } else {
              emailAddress = `${uniqueWord}.${username}@spamgourmet.com`;
            }
            
            emailPreview.textContent = emailAddress;
            return;
          }
        } catch (e) {
          console.error('Error parsing URL:', e);
        }
      }
      
      // Fallback if we can't get the site info
      const defaultPrefix = 'sitename';
      
      // Store the original parts for reset functionality
      originalEmailParts = {
        prefix: defaultPrefix,
        emails: maxEmails,
        username: username
      };
      
      // Update the custom fields
      customPrefixInput.value = defaultPrefix;
      customEmailsInput.value = blockingToggle.checked ? maxEmails : '';
      customUsernameInput.value = username;
      
      // Update the slider
      emailSlider.value = maxEmails;
      sliderValue.textContent = maxEmails;
      
      // Create email address with or without the number based on blocking setting
      let emailAddress;
      if (blockingToggle.checked) {
        emailAddress = `${defaultPrefix}.${maxEmails}.${username}@spamgourmet.com`;
      } else {
        emailAddress = `${defaultPrefix}.${username}@spamgourmet.com`;
      }
      
      emailPreview.textContent = emailAddress;
    });
  }

  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }

  function updatePermissionButton() {
    chrome.permissions.contains({
      permissions: ["activeTab", "scripting"],
      origins: ["<all_urls>"]
    }, (hasPermission) => {
      if (hasPermission) {
        allSitesPermissionButton.textContent = 'Disable';
        allSitesPermissionButton.classList.add('btn-secondary');
      } else {
        allSitesPermissionButton.textContent = 'Enable';
        allSitesPermissionButton.classList.remove('btn-secondary');
      }
    });
  }

  // Extract a meaningful site name from a hostname
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

  // Initialize the email preview
  updateSiteSpecificEmailPreview();
}); 