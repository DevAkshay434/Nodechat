import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Edit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import { GoogleSheetsImage, ShopifyPublishResponse } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

interface ContentPreviewProps {
  content: string;
  images: GoogleSheetsImage[];
  metadata?: {
    wordCount?: number;
    seoScore?: number;
    keywords?: string[];
  };
  shopifyResult?: ShopifyPublishResponse;
}

export default function ContentPreview({ content, images, metadata, shopifyResult }: ContentPreviewProps) {
  const [copied, setCopied] = useState(false);

  // Handle copy button click
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Process content to include images
  const processedContent = processContentWithImages(content, images);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated Content Preview</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center"
          >
            <Clipboard className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>

          {shopifyResult && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => window.open(shopifyResult.url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Shopify
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Content metadata */}
        {metadata && (
          <div className="mb-4 flex flex-wrap gap-2">
            {metadata.wordCount && (
              <Badge variant="secondary">
                ~{metadata.wordCount} words
              </Badge>
            )}
            {metadata.seoScore && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                SEO Score: {metadata.seoScore}/10
              </Badge>
            )}
            {metadata.keywords && metadata.keywords.slice(0, 5).map((keyword, i) => (
              <Badge key={i} variant="outline">
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="my-4" />

        {/* Rendered markdown content */}
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 prose max-w-none dark:prose-invert">
          <ReactMarkdown>{processedContent}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to process content and include images and links at appropriate positions
function processContentWithImages(content: string, images: GoogleSheetsImage[]): string {
  if (!images || images.length === 0) return content;

  // Clone the content
  let processedContent = content;

  // Find the main image (featured) and add it near the beginning
  const mainImage = images.find(img => img.type === 'main');
  if (mainImage) {
    // Insert after the first paragraph or after first heading if no paragraph
    const firstParagraphEnd = processedContent.indexOf("\n\n");
    const insertPosition = firstParagraphEnd > 0 ? firstParagraphEnd + 2 : processedContent.indexOf("\n") + 1;

    if (insertPosition > 0) {
      const imageMarkdown = `\n\n![${mainImage.alt}](${mainImage.url})\n\n`;
      processedContent = processedContent.substring(0, insertPosition) + imageMarkdown + processedContent.substring(insertPosition);
    }
  }

  // Insert secondary images throughout the content
  const secondaryImages = images.filter(img => img.type === 'secondary');
  if (secondaryImages.length > 0) {
    // Find all h2 headings to insert images after them
    const h2Matches = processedContent.match(/\n## .*?\n/g) || [];

    secondaryImages.forEach((image, index) => {
      if (index < h2Matches.length) {
        const h2Match = h2Matches[index];
        const h2Position = processedContent.indexOf(h2Match) + h2Match.length;

        // Find the end of the first paragraph after the heading
        const nextParagraphEnd = processedContent.indexOf("\n\n", h2Position);
        const insertPosition = nextParagraphEnd > h2Position ? nextParagraphEnd + 2 : h2Position;

        const imageMarkdown = `\n\n![${image.alt}](${image.url})\n\n`;
        processedContent = processedContent.substring(0, insertPosition) + imageMarkdown + processedContent.substring(insertPosition);
      }
    });
  }

  // Insert internal links throughout the content
  const links = images.filter(img => img.type === 'link');
  if (links.length > 0) {
    const paragraphs = processedContent.split("\n\n");

    links.forEach((link) => {
      // Find a suitable paragraph (not too short, not a heading)
      const eligibleParagraphs = paragraphs.filter(p => 
        !p.startsWith('#') && 
        !p.includes('](') &&
        p.length > 100
      );

      if (eligibleParagraphs.length > 0) {
        // Pick a random eligible paragraph
        const targetParagraph = eligibleParagraphs[Math.floor(Math.random() * eligibleParagraphs.length)];
        const paragraphIndex = paragraphs.indexOf(targetParagraph);

        if (paragraphIndex !== -1) {
          // Insert after a period, preferably in the middle
          const sentences = targetParagraph.split('. ');
          if (sentences.length > 1) {
            const middleSentenceIndex = Math.floor(sentences.length / 2);
            const linkText = link.linkText || 'Learn more here';
            sentences[middleSentenceIndex] += `. [${linkText}](${link.url})`;
            paragraphs[paragraphIndex] = sentences.join('. ');
          }
        }
      }
    });

    processedContent = paragraphs.join("\n\n");
  }

  // Add videos before the conclusion
  const videos = images.filter(img => img.type === 'video');
  if (videos.length > 0) {
    // Find the last heading or near the end
    const paragraphs = processedContent.split("\n\n");
    let insertIndex = paragraphs.length - 2; // Default to near the end

    // Look for the last or second-to-last heading
    for (let i = paragraphs.length - 3; i >= 0; i--) {
      if (paragraphs[i].startsWith('##')) {
        insertIndex = i;
        break;
      }
    }

    let videoSection = "## Related Videos\n\n";
    videos.forEach(video => {
      if (video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
        const videoId = extractYoutubeId(video.url);
        if (videoId) {
          videoSection += `<div class="video-wrapper">\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>\n</div>\n\n`;
        }
      } else {
        videoSection += `[Watch Video: ${video.alt || 'Related Content'}](${video.url})\n\n`;
      }
    });

    // Insert the video section
    paragraphs.splice(insertIndex, 0, videoSection);
    processedContent = paragraphs.join("\n\n");
  }

  return processedContent;
}

// Helper to extract YouTube video ID
function extractYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}