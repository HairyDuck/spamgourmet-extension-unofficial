# Privacy Practices and Permissions Justifications

This document provides justifications for each permission used by the Spamgourmet Email Generator (Unofficial) extension, as required by the Chrome Web Store.

## Single Purpose Description

```
The single purpose of this extension is to help users generate disposable Spamgourmet email addresses while browsing, protecting their real email address from spam and unwanted communications.
```

## Permission Justifications

### Storage Permission

```
The extension uses the storage permission to save:
1. User preferences (default number of messages, username, etc.)
2. History of previously generated email addresses
3. Configuration settings

This data is stored locally on the user's device using Chrome's built-in storage API and is not transmitted to any external servers except for the Spamgourmet service when generating addresses.
```

### Context Menus Permission

```
The contextMenus permission is used to add a right-click menu option that allows users to quickly generate and insert Spamgourmet email addresses when right-clicking on email input fields. This provides convenient access to the core functionality without requiring the user to open the extension popup.
```

### Active Tab Permission

```
The activeTab permission is used only when the user explicitly chooses to insert a generated email address into a form field on the current webpage. This allows the extension to interact with the currently active tab but only when the user initiates the action. The extension does not read or access any sensitive information from the page.
```

### Scripting Permission

```
The scripting permission is used in conjunction with activeTab to insert generated email addresses into form fields when the user selects this action. It allows the extension to execute a small script that identifies the appropriate form field and inserts the generated address. The script does not collect or transmit any user data.
```

### Host Permissions

```
The optional host permissions (<all_urls>) are used only when the user activates the "insert email" functionality. This permission is needed to allow the extension to insert generated email addresses into form fields on websites. The extension does not track browsing history or collect data from websites.
```

### Remote Code Justification

```
The extension does not execute any remote code. All code is packaged with the extension and runs locally on the user's device. The only external communication is with the Spamgourmet service to generate valid email addresses according to their format requirements.
```

## Data Usage Certification

I certify that this extension complies with the Chrome Web Store Developer Program Policies, including:

1. The extension collects only the minimum amount of data necessary for its functionality
2. All user data is stored locally on the user's device
3. No user data is shared with third parties except when necessary to fulfill the core functionality (generating valid Spamgourmet addresses)
4. The privacy policy clearly discloses all data collection and usage
5. The extension does not use remote code execution
6. The extension does not misuse or abuse the Chrome Web Store or Chrome browser

## Screenshot Guidance

The following screenshots should be included with your Chrome Web Store submission:

1. **Main Popup Interface**: Show the extension popup with the email generation form
2. **Generated Email Address**: Display a successfully generated Spamgourmet address
3. **Context Menu Integration**: Show the right-click context menu with the "Generate Spamgourmet Email" option
4. **Settings Page**: Display the extension's settings/options page
5. **Email Address Insertion**: Show the extension inserting an email address into a form field 