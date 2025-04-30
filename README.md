# Shopify Content Generator

A full-stack web application that generates SEO-optimized content using OpenAI, sources media from Google Sheets, and publishes directly to Shopify stores.

## Features

- AI-powered content generation with OpenAI GPT models
- Dynamic media integration from user-specified Google Sheets
- Internal linking capability
- YouTube video embedding
- Direct publishing to Shopify as blog posts or pages
- Customizable content structure with headings, lists, tables, and FAQs

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **API Integrations**: OpenAI API, Google Sheets API, Shopify Admin API
- **State Management**: React Query
- **Form Handling**: React Hook Form with Zod validation

## Setup on Replit

1. **Fork this Replit** or create a new Replit from this template
2. **Set up environment variables** in the Replit Secrets panel:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_API_KEY`: Your Google API key with Sheets API enabled
   - `GOOGLE_SHEET_ID`: (Optional) Default Google Sheet ID to use
   - `SHOPIFY_DOMAIN`: Your Shopify store domain (e.g., `your-store.myshopify.com`)
   - `SHOPIFY_API_KEY`: Your Shopify API key
   - `SHOPIFY_API_PASSWORD`: Your Shopify API password/access token

3. **Run the application** by clicking the Run button in Replit
4. **Access the application** in the Replit webview

## Using the Form to Generate Content

1. **Fill in the form fields**:
   - **Basic Settings**: Enter a title, specify the number of H2 sections and their length
   - **Content Style**: Choose the voice, intro type, and FAQs option
   - **Content Elements**: Toggle tables, lists, and H3 subheadings
   - **Image & Media Settings**: 
     - Set the number of images
     - Select a content category or enter your own Google Sheet ID/URL
     - Enable/disable internal links

2. **Click "Generate & Publish Content"** to create content
3. **Preview the result** with all images and formatting
4. If publishing to Shopify, the app will handle the creation of a blog post or page

## How Image Embedding Works

The application fetches images and links from Google Sheets with the following logic:

1. **Sheet Access**: 
   - You can provide a custom Sheet ID or URL in the form
   - Or select a predefined category with preset sheets
   - Or use the default Sheet ID from environment variables

2. **Sheet Structure**:
   - The sheet should have columns for MAIN IMAGE, SECONDARY IMAGE, VIDEOS, and LINKS
   - The first row is treated as headers
   - Subsequent rows contain the data

3. **Image Selection**:
   - The app randomly selects images from the available rows
   - The main/featured image is placed near the beginning of the content
   - Secondary images are distributed throughout the content after H2 headings
   - Videos (if available) are placed in a "Related Videos" section at the end
   - Internal links are naturally inserted into paragraphs when enabled

4. **Sharing Your Google Sheet**:
   - Make sure your Google Sheet is shared with "Anyone with the link can view" permissions
   - The Google API key must have Sheets API access enabled

## Connecting Your APIs

### OpenAI API

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Create an API key in your dashboard
3. Add the API key to Replit Secrets as `OPENAI_API_KEY`

### Google Sheets API

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Sheets API
3. Create an API key and restrict it to Sheets API
4. Add the API key to Replit Secrets as `GOOGLE_API_KEY`
5. Create a Google Sheet and share it with "Anyone with the link can view"

### Shopify API

1. Create a [Shopify Partner account](https://partners.shopify.com/)
2. Create a private app in your Shopify store
3. Grant access to the necessary scopes (read/write blog, pages)
4. Add the credentials to Replit Secrets:
   - `SHOPIFY_DOMAIN`: Your store's domain
   - `SHOPIFY_API_KEY`: The API key from your private app
   - `SHOPIFY_API_PASSWORD`: The password/token from your private app

## Environment Variables Format

Create the following environment variables in the Replit Secrets panel:

```
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SHEET_ID=your-default-google-sheet-id
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_PASSWORD=your-shopify-api-password
```

## Customizing the Application

### Content Generation

- The OpenAI prompt format can be modified in `server/services/openai.ts` in the `constructPrompt` function
- To add more form fields, update both `shared/schema.ts` and `client/src/components/ContentGeneratorForm.tsx`

### Media Integration

- Google Sheet column detection can be adjusted in `server/services/googleSheets.ts`
- Image placement logic can be modified in `client/src/components/ContentPreview.tsx`

### Output Formatting

- To change the HTML output format, edit the `convertMarkdownToHtml` function in `server/services/shopify.ts`
- Adjust markdown processing in the `processContentWithImages` function in `client/src/components/ContentPreview.tsx`

### API Integration

- OpenAI API settings can be tuned in `server/services/openai.ts`
- Google Sheets API handling can be customized in `server/services/googleSheets.ts`
- Shopify API publishing can be adjusted in `server/services/shopify.ts`