/**
 * Google Sheets Service Module
 *
 * This module handles all interactions with the Google Sheets API for fetching
 * images, videos, and links to be used in the generated content.
 *
 * Key customization points:
 * - Add or modify the CATEGORY_SHEET_IDS to include your own sheets
 * - Adjust column detection logic in findColumnIndex function
 * - Modify how images and links are selected from the sheet
 * - Change random selection logic or prioritization
 */

import axios from "axios";
import { GoogleSheetsImage } from "@shared/schema";

// Default placeholder images for when Google Sheets fails
const PLACEHOLDER_IMAGES = [
  {
    url: "https://placehold.co/800x450?text=Featured+Image",
    alt: "Placeholder featured image",
    type: "main" as const,
  },
  {
    url: "https://placehold.co/600x400?text=Image+1",
    alt: "Placeholder image 1",
    type: "secondary" as const,
  },
  {
    url: "https://placehold.co/600x400?text=Image+2",
    alt: "Placeholder image 2",
    type: "secondary" as const,
  },
  {
    url: "https://placehold.co/600x400?text=Image+3",
    alt: "Placeholder image 3",
    type: "secondary" as const,
  },
];

// Predefined category-based Sheet IDs
const CATEGORY_SHEET_IDS: Record<string, string> = {
  plumbing: "1xkuwYg5soaOdu5svjMKrwAva8yv9F4sVLFI0fCSg7aM", // Central Plumbing sheet
  fitness: "1bJLJ3uQWs5USc4xrO21dQRoqwRVP9dGsU-GmCM2qn7o",
  legal: "1j2NjU8Z7X3_fRbXoJh9XT-ZmH_7UO2JLUdz7bLSc3qE",
  home: "1MtV1OQlCZnNQCJKkT_GnRiRCKj5wDvQyqX95lW_jWg0",
  tech: "1Q7oJD6Y6NnZYeV2iFM3j9I4H7yPcnA5_fTX0I5N5vgw",
};

/**
 * Extract the Sheet ID from a Google Sheets URL or ID string
 *
 * This function handles both direct IDs and full Google Sheet URLs.
 * For example, it will extract the ID from:
 * - https://docs.google.com/spreadsheets/d/1xkuwYg5soaOdu5svjMKrwAva8yv9F4sVLFI0fCSg7aM/edit
 * - 1xkuwYg5soaOdu5svjMKrwAva8yv9F4sVLFI0fCSg7aM (direct ID)
 *
 * @param input - The URL or ID string
 * @returns The extracted Google Sheet ID or empty string if not found
 */
function extractSheetId(input: string): string {
  // If input is already a valid sheet ID, return it
  if (/^[a-zA-Z0-9_-]{30,}$/.test(input)) {
    return input;
  }

  // Try to extract from URL
  const urlPattern = /\/d\/([a-zA-Z0-9_-]+)/;
  const match = input.match(urlPattern);

  if (match && match[1]) {
    return match[1];
  }

  return ""; // Return empty if no valid ID found
}

interface GoogleSheetsFetchOptions {
  imageCount: number;
  googleSheetId?: string;
  category?: string;
  enableInternalLinks?: boolean;
}

/**
 * Fetches images and links from a Google Sheet
 * @param options Object containing imageCount, googleSheetId, category, etc.
 * @returns Array of image and link objects with URLs and alt text
 *
 * This function is the main entry point for retrieving media from Google Sheets.
 * It supports:
 * 1. Custom Google Sheet URLs/IDs provided directly by the user
 * 2. Predefined category-based sheets (plumbing, fitness, legal, etc.)
 * 3. Default sheet from environment variables
 *
 * The function automatically detects column names and handles different sheet structures.
 * It can extract main images, secondary images, videos (embedded YouTube), and internal links.
 *
 * Implementation details:
 * - Detects the first sheet in the spreadsheet if not named "Sheet1"
 * - Uses flexible column name matching (e.g., "MAIN IMAGE", "FEATURED IMAGE")
 * - Randomly selects rows to get diverse media for each generation
 * - Adds natural-sounding link text for internal links
 * - Falls back to placeholder images if API calls fail
 */
export async function fetchImagesFromGoogleSheets(
  options: GoogleSheetsFetchOptions | number,
): Promise<GoogleSheetsImage[]> {
  // Handle legacy calls with just imageCount
  if (typeof options === "number") {
    options = { imageCount: options };
  }

  const {
    imageCount,
    googleSheetId: customSheetId = "",
    category = "",
    enableInternalLinks = true,
  } = options;

  try {
    // Get API key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("Google API key not configured, using placeholder images");
      return PLACEHOLDER_IMAGES.slice(0, imageCount);
    }

    // Determine which Sheet ID to use
    let effectiveSheetId = "";

    // 1. Try user-provided custom Sheet ID first
    if (customSheetId) {
      effectiveSheetId = extractSheetId(customSheetId);
    }

    // 2. If not valid, try category-based Sheet ID
    if (
      !effectiveSheetId &&
      category &&
      CATEGORY_SHEET_IDS[category.toLowerCase()]
    ) {
      effectiveSheetId = CATEGORY_SHEET_IDS[category.toLowerCase()];
    }

    // 3. Fall back to the default Sheet ID from env
    if (!effectiveSheetId) {
      effectiveSheetId = process.env.GOOGLE_SHEET_ID || "";
    }

    if (!effectiveSheetId) {
      console.warn("No valid Google Sheet ID found, using placeholder images");
      return PLACEHOLDER_IMAGES.slice(0, imageCount);
    }

    try {
      console.log(`Attempting to fetch sheet with ID: ${effectiveSheetId}`);

      // First, try to get the spreadsheet to check if we have access and what sheets are available
      const spreadsheetResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${effectiveSheetId}?key=${apiKey}`,
      );

      // Get the first sheet's title
      let sheetTitle = "Sheet1";
      if (
        spreadsheetResponse.data &&
        spreadsheetResponse.data.sheets &&
        spreadsheetResponse.data.sheets.length > 0
      ) {
        sheetTitle = spreadsheetResponse.data.sheets[0].properties.title;
        console.log(`Using sheet title: ${sheetTitle}`);
      }

      // Fetch sheet data
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${effectiveSheetId}/values/${sheetTitle}!A1:F100?key=${apiKey}`,
      );

      const processSheetData = (rows: any[][], imageCount: number): GoogleSheetsImage[] => {
        // Skip header row and get available image rows
        const dataRows = rows.slice(1);

        // Find column indexes
        const headers = rows[0];

        // More flexible column name matching
        const findColumnIndex = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            const index = headers.findIndex(
              (h: string) =>
                typeof h === "string" &&
                h.toUpperCase().includes(name.toUpperCase()),
            );
            if (index !== -1) return index;
          }
          return -1;
        };

        const mainImageColIndex = findColumnIndex([
          "MAIN IMAGES",
          "FEATURED",
          "IMAGE",
          "PICTURE",
        ]);
        const secondaryImageColIndex = findColumnIndex([
          "PRODUCT MEMES & IMAGES",
          "ADDITIONAL",
          "IMAGE",
          "PICTURE",
        ]);
        const videoColIndex = findColumnIndex(["VIDEOS", "VIDEO", "MEDIA"]);
        const linkColIndex = findColumnIndex(["LINK", "URL", "HREF"]);

        // If we can't find the columns, use placeholder images
        if (mainImageColIndex === -1 && secondaryImageColIndex === -1) {
          console.warn(
            "Required columns not found in Google Sheet, using placeholder images",
          );
          return PLACEHOLDER_IMAGES.slice(0, imageCount);
        }

        // Process and return image URLs
        const images: GoogleSheetsImage[] = [];

        // Get a random row index to ensure diverse images
        const getRandomRow = () => Math.floor(Math.random() * dataRows.length);

        // Get main image (featured image)
        if (mainImageColIndex !== -1) {
          const mainImageRow = dataRows[getRandomRow()];
          if (mainImageRow && mainImageRow[mainImageColIndex]) {
            images.push({
              url: mainImageRow[mainImageColIndex],
              alt: mainImageRow[0] || "Featured image", // Use first column as alt text if available
              type: "main",
            });
          } else {
            // Use placeholder for main image
            images.push(PLACEHOLDER_IMAGES[0]);
          }
        } else {
          // Use placeholder for main image
          images.push(PLACEHOLDER_IMAGES[0]);
        }

        // Get secondary images if requested (body images)
        const secondaryImageCount = Math.max(0, imageCount - 1); // -1 for the main image

        if (secondaryImageColIndex !== -1) {
          const usedRowIndexes = new Set<number>();

          for (let i = 0; i < secondaryImageCount; i++) {
            let attempts = 0;
            let rowIndex;

            // Try to find unique rows up to 10 attempts
            do {
              rowIndex = getRandomRow();
              attempts++;
            } while (usedRowIndexes.has(rowIndex) && attempts < 10);

            usedRowIndexes.add(rowIndex);
            const row = dataRows[rowIndex];

            if (row && row[secondaryImageColIndex]) {
              images.push({
                url: row[secondaryImageColIndex],
                alt: row[0] || `Image ${i + 1}`,
                type: "secondary",
              });
            } else {
              // Use placeholder if no valid image in this row
              images.push({
                url:
                  PLACEHOLDER_IMAGES[i + 1]?.url ||
                  `https://placehold.co/600x400?text=Image+${i + 1}`,
                alt: `Placeholder image ${i + 1}`,
                type: "secondary",
              });
            }
          }
        } else {
          // Use placeholders for secondary images
          for (let i = 0; i < secondaryImageCount; i++) {
            images.push(
              PLACEHOLDER_IMAGES[i + 1] || {
                url: `https://placehold.co/600x400?text=Image+${i + 1}`,
                alt: `Placeholder image ${i + 1}`,
                type: "secondary" as const,
              },
            );
          }
        }

        // Get internal links if enabled
        if (enableInternalLinks && linkColIndex !== -1) {
          // Get 1-2 random links
          const linkCount = Math.min(2, Math.ceil(Math.random() * 2));
          const usedLinkIndexes = new Set<number>();

          for (let i = 0; i < linkCount; i++) {
            let attempts = 0;
            let rowIndex;

            // Try to find unique rows up to 10 attempts
            do {
              rowIndex = getRandomRow();
              attempts++;
            } while (usedLinkIndexes.has(rowIndex) && attempts < 10);

            usedLinkIndexes.add(rowIndex);
            const row = dataRows[rowIndex];

            if (row && row[linkColIndex]) {
              // Create link text options
              const linkTextOptions = [
                "Learn more here",
                "Read more about this",
                "Click here for details",
                "Find out more",
                "Discover more",
                "See related information",
              ];

              const randomLinkText =
                linkTextOptions[
                  Math.floor(Math.random() * linkTextOptions.length)
                ];

              images.push({
                url: row[linkColIndex],
                alt: row[0] || randomLinkText,
                type: "link",
                linkText: randomLinkText,
              });
            }
          }
        }

        // Get a video if column exists and we have room for more media
        if (videoColIndex !== -1 && images.length < imageCount + 2) {
          // +2 to allow for video + links
          const videoRow = dataRows[getRandomRow()];
          if (videoRow && videoRow[videoColIndex]) {
            images.push({
              url: videoRow[videoColIndex],
              alt: "Video content",
              type: "video",
            });
          }
        }

        return images;
      }

      if (
        !response.data ||
        !response.data.values ||
        response.data.values.length < 2
      ) {
        console.warn(
          "No valid data found in Google Sheet, retrying with default sheet",
        );
        // Try fetching from default sheet instead
        const defaultSheetId = process.env.GOOGLE_SHEET_ID;
        if (defaultSheetId) {
          const retryResponse = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${defaultSheetId}/values/Sheet1!A1:F100?key=${apiKey}`
          );

          if (retryResponse.data?.values?.length > 1) {
            return processSheetData(retryResponse.data.values, imageCount);
          }
        }
        throw new Error("Unable to fetch images from any available sheet");
      }

      return processSheetData(response.data.values, imageCount);
    } catch (apiError: any) {
      console.error("API Error when fetching from Google Sheets:", apiError);

      // Provide more detailed error messages for debugging
      if (apiError.response) {
        console.error("Google Sheets API response error:");
        console.error("  Status:", apiError.response.status);
        console.error(
          "  Data:",
          JSON.stringify(apiError.response.data, null, 2),
        );

        // Check if this is a permissions issue
        if (apiError.response.status === 403) {
          console.error(
            "This appears to be a permissions issue. Make sure the Google Sheet is publicly accessible.",
          );
        } else if (apiError.response.status === 404) {
          console.error(
            "Sheet not found. Check if the Sheet ID is correct and the sheet exists.",
          );
        } else if (apiError.response.status === 400) {
          console.error(
            "Bad request. The Sheet might not be shared correctly or the API key doesn't have access.",
          );
          console.error(
            "Make sure to set sharing to 'Anyone with the link can view'",
          );
        }
      }

      console.log("Using placeholder images instead");
      return PLACEHOLDER_IMAGES.slice(0, imageCount);
    }
  } catch (error) {
    console.error("Error in GoogleSheets service:", error);
    return PLACEHOLDER_IMAGES.slice(0, imageCount);
  }
}