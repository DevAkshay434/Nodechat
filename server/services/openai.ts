/**
 * OpenAI Service Module
 * 
 * This module handles all interaction with the OpenAI API for content generation.
 * It contains functions for creating prompts, generating content, and analyzing content.
 * 
 * Key customization points:
 * - Update the constructPrompt function to change how AI generates content
 * - Modify the temperature setting (0.7) to control creativity vs. consistency
 * - Change the model from gpt-4o to another OpenAI model if needed
 * - Adjust the metadata generation to extract different information
 */

import OpenAI from "openai";
import { type ContentForm } from "@shared/schema";

// Initialize the OpenAI client with API key from environment variables
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates content using OpenAI based on user form inputs
 * 
 * This is the main entry point function used by the routes.ts file.
 * It orchestrates the process of generating content:
 * 1. Constructs a prompt based on form data
 * 2. Calls the OpenAI API to generate content
 * 3. Analyzes the content to generate metadata
 * 4. Returns both content and metadata
 * 
 * @param formData - Form data from the client with content generation parameters
 * @returns Object containing generated content and metadata
 */
export async function generateContent(formData: ContentForm) {
  try {
    // Construct the base prompt
    const prompt = constructPrompt(formData);
    
    // Call OpenAI API
    // CUSTOMIZATION: Adjust temperature (0.7) for more creativity (higher) or consistency (lower)
    // CUSTOMIZATION: Adjust max_tokens (3000) if you need longer or shorter content
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    });
    
    // Extract content from response
    const content = response.choices[0].message.content || "";
    
    // Generate metadata with a separate API call
    const metadata = await generateMetadata(content, formData.title);
    
    return {
      content,
      metadata
    };
  } catch (error: any) {
    console.error("OpenAI generation error:", error);
    throw new Error(`Failed to generate content: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Constructs the prompt for OpenAI based on form inputs
 * 
 * THIS IS THE MAIN CUSTOMIZATION POINT for content generation.
 * Modify this function to change how the AI generates content.
 * 
 * @param formData - Form data from the client with content generation parameters
 * @returns A string prompt to send to OpenAI
 */
function constructPrompt(formData: ContentForm): string {
  const {
    title,
    numH2s,
    h2WordLimit,
    sectionLength,
    voice,
    enableTables,
    enableLists,
    enableH3,
    introType,
    faqType,
    selectedProducts,
    selectedCollections
  } = formData;

  // Convert products and collections to formatted strings
  const productLinks = selectedProducts?.map(p => `[${p.title}](${p.url})`).join(', ') || '';
  const collectionLinks = selectedCollections?.map(c => `[${c.title}](${c.url})`).join(', ') || '';

  return `
You are an expert SEO blog writer and content strategist. Your goal is to write high-quality, engaging, and SEO-optimized blog posts that sound natural and authoritative.

Based on the following inputs:
Title: ${title}
Number of H2s: ${numH2s}
H2 Word Limit: ${h2WordLimit} words
Section Length: ${sectionLength}
Voice: ${voice}
Intro Type: ${introType}
FAQ Section: ${faqType}
Enable H3: ${enableH3 ? 'Yes' : 'No'}
Enable Lists: ${enableLists ? 'Yes' : 'No'}
Enable Tables: ${enableTables ? 'Yes' : 'No'}

Selected Products to Link: ${productLinks}
Selected Collections to Link: ${collectionLinks}

Write the article with these specific rules:

Each section must naturally transition into the next.

Use consistent ${voice} voice throughout.

Internal Linking Rules:
- Naturally incorporate links to the selected products and collections throughout the content
- Place links where they provide value and context to the reader
- Avoid forced or excessive linking
- Use varied anchor text that includes both exact match and related terms

${introType !== 'None' 
  ? `Start with a ${introType === 'Search Intent intro' 
      ? 'search intent focused introduction that directly addresses what the reader is looking for' 
      : 'standard introduction that sets the context for the article'}.` 
  : 'Skip the introduction and start directly with the first H2 section.'}

For each H2 section (total of ${numH2s}):
- Write a curiosity-driven heading with at most ${h2WordLimit} words
- Write ${sectionLength === 'Small' ? '2' : sectionLength === 'Medium' ? '3' : '4'} paragraphs based on the section size
- Include at least one relevant product or collection link per section where appropriate

${enableH3 ? 'Use H3 subheadings within H2 sections where appropriate to break down complex topics.' : 'Do not use H3 subheadings.'}
${enableLists ? 'Include bullet or numbered lists where appropriate to organize information.' : 'Do not use bullet or numbered lists.'}
${enableTables ? 'Include at least one data table where appropriate to present comparative information.' : 'Do not include data tables.'}

Before the FAQ section, include a placeholder for a video with this markdown:
[VIDEO_PLACEHOLDER]

${faqType !== 'No FAQ' 
  ? `End with a FAQ section with 3-5 questions and ${faqType === 'FAQ + Short Answer' ? 'brief' : 'detailed'} answers. Include relevant product/collection links in the answers where appropriate.` 
  : 'Do not include a FAQ section.'}

Write a meta description (150-160 characters) at the very end.

Do not include a generic conclusion, and do not repeat information.

Format the entire content in markdown.
`;
`;
}

/**
 * Generate metadata about the content for reporting and analytics
 * 
 * Makes a second call to OpenAI to analyze the generated content
 * and extract useful metadata like word count, SEO score, and keywords.
 * 
 * CUSTOMIZATION POINTS:
 * - Change the "system" prompt to extract different metadata
 * - Modify how much content is sent for analysis (currently first 1000 chars)
 * - Adjust output format or analysis criteria
 * 
 * @param content - The generated content to analyze
 * @param title - The title of the content
 * @returns Metadata object with word count, SEO score, and keywords
 */
async function generateMetadata(content: string, title: string) {
  try {
    // Make a second API call to analyze the content and generate metadata
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze the following content and provide metadata in JSON format including approximate word count, SEO score (1-10), and key SEO keywords/phrases."
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content.substring(0, 1000)}...` // Send truncated content for analysis
        }
      ],
      // Ensure we get a valid JSON response
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const metadata = JSON.parse(response.choices[0].message.content || "{}");
    return metadata;
  } catch (error: any) {
    console.error("Error generating metadata:", error);
    // Return empty object if metadata generation fails - this allows the main content
    // to still be returned even if metadata generation fails
    return {}; 
  }
}
