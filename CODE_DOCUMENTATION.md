# Code Documentation

This file explains the purpose and structure of each major file in the Shopify Content Generator project, along with guidance on where to make common customizations.

## Core Files and Their Purpose

### Backend (Server)

#### `server/index.ts`
- **Purpose**: Entry point for the Express server
- **Key Functions**: Sets up Express middleware, registers routes, handles errors
- **Customization**: Add more global middleware or error handling here

#### `server/routes.ts`
- **Purpose**: Defines all API endpoints
- **Key Functions**: 
  - `/api/generate-content`: The main endpoint that handles content generation workflow
  - `/api/check-connections`: Verifies if APIs are configured correctly
  - `/api/recent-content`: Gets recent content items from storage
- **Customization**: Add new API routes or modify existing ones here

#### `server/storage.ts`
- **Purpose**: Handles data persistence
- **Key Functions**: Manages storing content items and user data in memory
- **Customization**: Modify to integrate with a database if needed

#### `server/services/openai.ts`
- **Purpose**: Handles interactions with OpenAI API
- **Key Functions**: 
  - `generateContent`: Main function that calls OpenAI
  - `constructPrompt`: Builds the prompt sent to OpenAI
- **API Calls**: OpenAI Chat Completion API
- **Customization**: 
  - Modify `constructPrompt` to change the AI instructions
  - Adjust temperature, max tokens in the OpenAI call
  - Update or add functions for different AI use cases

#### `server/services/googleSheets.ts`
- **Purpose**: Manages Google Sheets integration for images and links
- **Key Functions**: `fetchImagesFromGoogleSheets`: Gets media from Google Sheets
- **API Calls**: Google Sheets API
- **Customization**:
  - Edit column detection logic to match your sheet structure
  - Modify the `CATEGORY_SHEET_IDS` object to change preset category sheets
  - Adjust image selection algorithm

#### `server/services/shopify.ts`
- **Purpose**: Handles publishing content to Shopify
- **Key Functions**: 
  - `publishToShopify`: Main function that determines publishing type
  - `publishBlogPost`: Publishes content as a blog post
  - `publishPage`: Publishes content as a page
  - `convertMarkdownToHtml`: Converts markdown to HTML for Shopify
- **API Calls**: Shopify Admin API
- **Customization**:
  - Modify `convertMarkdownToHtml` to change output formatting
  - Update the API endpoints for newer Shopify API versions
  - Add support for more Shopify content types

### Frontend (Client)

#### `client/src/App.tsx`
- **Purpose**: Main application component and router setup
- **Key Functions**: Sets up routes and global layout
- **Customization**: Add new routes or change the application layout

#### `client/src/pages/home.tsx`
- **Purpose**: Main page component that contains the content generator
- **Key Functions**: Manages application state and content generation flow
- **Customization**: Modify the layout or add more sections to the home page

#### `client/src/components/ContentGeneratorForm.tsx`
- **Purpose**: Form for content generation settings
- **Key Functions**: Manages form state, validation, and submission
- **Customization**:
  - Add new form fields to control content generation
  - Modify form sections or layout
  - Change default values

#### `client/src/components/ContentPreview.tsx`
- **Purpose**: Preview generated content with images and formatting
- **Key Functions**: 
  - Displays the generated content
  - `processContentWithImages`: Integrates images into content
  - `extractYoutubeId`: Processes YouTube links for embedding
- **Customization**:
  - Change how images are placed in content
  - Modify the display of metadata or Shopify publishing results
  - Edit YouTube embedding logic

#### `client/src/components/InfoPanel.tsx`
- **Purpose**: Shows connection status for various APIs
- **Key Functions**: Displays the status of OpenAI, Google Sheets, and Shopify connections
- **Customization**: Add more status indicators or information sections

#### `client/src/components/StatusAlert.tsx`
- **Purpose**: Shows status messages to the user
- **Key Functions**: Displays success, error, or loading messages
- **Customization**: Add more message types or change the alert appearance

### Shared

#### `shared/schema.ts`
- **Purpose**: Defines data models and validation schemas
- **Key Functions**: 
  - Defines database tables and types
  - Contains form validation schemas
  - Defines API response types
- **Customization**:
  - Add or modify fields in `contentFormSchema` to change form options
  - Update the `GoogleSheetsImage` interface to support more media types
  - Add new response types for additional features

## Common Customization Tasks

### Adding a New Form Field

1. Add the field to `contentFormSchema` in `shared/schema.ts`
2. Add a default value in `useForm` in `ContentGeneratorForm.tsx`
3. Add the form field UI in the appropriate section of `ContentGeneratorForm.tsx`
4. Update the `constructPrompt` function in `openai.ts` to use the new field

### Changing the OpenAI Prompt

1. Locate the `constructPrompt` function in `server/services/openai.ts`
2. Modify the template strings and instructions
3. Consider adjusting model parameters like temperature for different creativity levels

### Modifying Image Placement

1. Find the `processContentWithImages` function in `client/src/components/ContentPreview.tsx`
2. Edit the logic that determines where images are placed
3. For Shopify HTML output, also check `convertMarkdownToHtml` in `server/services/shopify.ts`

### Adding a New API Integration

1. Create a new service file in `server/services/`
2. Add environment variables for the API credentials
3. Update the connections check in `/api/check-connections` endpoint
4. Add UI components to display and use the new integration