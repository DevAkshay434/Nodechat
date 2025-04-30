import axios from "axios";
import { GoogleSheetsImage } from "@shared/schema";

interface ShopifyPublishRequest {
  title: string;
  content: string;
  images: GoogleSheetsImage[];
  publishType: "blog" | "page" | "draft";
}

/**
 * yev Publishes content to Shopify via Admin API
 */
export async function publishToShopify(request: ShopifyPublishRequest) {
  try {
    const { title, content, images, publishType } = request;

    // Get Shopify credentials from environment variables
    const shopDomain = process.env.SHOPIFY_DOMAIN;
    const apiKey = process.env.SHOPIFY_API_KEY;
    const password = process.env.SHOPIFY_API_PASSWORD;

    if (!shopDomain || !apiKey || !password) {
      throw new Error("Shopify API credentials not configured");
    }

    // Prepare authentication
    const auth = {
      username: apiKey,
      password: password,
    };

    // Convert markdown content to HTML with images inserted at appropriate positions
    const htmlContent = convertMarkdownToHtml(content, images);

    // Publish as either a blog post or a page
    if (publishType === "blog") {
      return await publishBlogPost(
        shopDomain,
        auth,
        title,
        htmlContent,
        images,
      );
    } else {
      return await publishPage(shopDomain, auth, title, htmlContent, images);
    }
  } catch (error) {
    console.error("Shopify publishing error:", error);
    throw new Error(`Failed to publish to Shopify: ${error.message}`);
  }
}

/**
 * Publishes content as a blog post
 */
async function publishBlogPost(
  shopDomain: string,
  auth: any,
  title: string,
  htmlContent: string,
  images: GoogleSheetsImage[],
) {
  // Find featured image (type: main)
  const featuredImage = images.find((img) => img.type === "main");

  // Create the blog post payload
  const blogPost = {
    article: {
      title: title,
      author: "Content Generator",
      tags: "auto-generated, seo",
      body_html: htmlContent,
      published: true,
      image: featuredImage ? { src: featuredImage.url } : undefined,
    },
  };

  // Get the first blog ID (we'll use the default blog)
  const blogsResponse = await axios.get(
    `https://${shopDomain}/admin/api/2023-04/blogs.json`,
    { auth },
  );

  if (!blogsResponse.data.blogs || blogsResponse.data.blogs.length === 0) {
    throw new Error("No blogs found in Shopify store");
  }

  const blogId = blogsResponse.data.blogs[0].id;

  // Create the blog post
  const response = await axios.post(
    `https://${shopDomain}/admin/api/2023-04/blogs/${blogId}/articles.json`,
    blogPost,
    { auth },
  );

  return {
    id: response.data.article.id,
    url: `https://${shopDomain}/blogs/${blogId}/${response.data.article.handle}`,
    title: response.data.article.title,
    status: "published",
  };
}

/**
 * Publishes content as a page
 */
async function publishPage(
  shopDomain: string,
  auth: any,
  title: string,
  htmlContent: string,
  images: GoogleSheetsImage[],
) {
  // Create the page payload
  const page = {
    page: {
      title: title,
      body_html: htmlContent,
      published: true,
    },
  };

  // Create the page
  const response = await axios.post(
    `https://${shopDomain}/admin/api/2023-04/pages.json`,
    page,
    { auth },
  );

  return {
    id: response.data.page.id,
    url: `https://${shopDomain}/pages/${response.data.page.handle}`,
    title: response.data.page.title,
    status: "published",
  };
}

/**
 * Converts markdown to HTML and inserts images
 */
function convertMarkdownToHtml(
  markdown: string,
  images: GoogleSheetsImage[],
): string {
  // This is a simplified markdown to HTML conversion
  // In a production app, you'd use a proper markdown library
  let html = markdown
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^#### (.*?)$/gm, "<h4>$1</h4>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  // Fix lists
  html = html.replace(/<li>(.*?)<\/li><\/p><p><li>/g, "<li>$1</li><li>");
  html = html.replace(/<p><li>(.*?)(<\/li>.*?)<\/p>/g, "<ul><li>$1$2</ul>");

  // Insert secondary images strategically through the content
  const secondaryImages = images.filter((img) => img.type === "secondary");

  if (secondaryImages.length > 0) {
    // Find all h2 tags to insert images after them
    const h2Matches = html.match(/<h2>.*?<\/h2>/g) || [];

    secondaryImages.forEach((image, index) => {
      if (index < h2Matches.length) {
        // Insert after a heading
        const h2Tag = h2Matches[index];
        const h2Position = html.indexOf(h2Tag) + h2Tag.length;
        const imageTag = `<img src="${image.url}" alt="${image.alt}" class="shopify-content-image" />`;

        html =
          html.substring(0, h2Position) + imageTag + html.substring(h2Position);
      } else {
        // Append to the end if we run out of headings
        html += `<img src="${image.url}" alt="${image.alt}" class="shopify-content-image" />`;
      }
    });
  }

  // Insert videos at the end
  const videos = images.filter((img) => img.type === "video");

  videos.forEach((video) => {
    html += `<div class="video-container"><iframe src="${video.url}" frameborder="0" allowfullscreen></iframe></div>`;
  });

  return html;
}
