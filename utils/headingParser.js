const cheerio = require('cheerio');

/**
 * Decodes HTML entities in a string
 * @param {string} html - HTML content with encoded entities
 * @returns {string} - Decoded HTML content
 */
const decodeHtmlEntities = html => {
  if (!html) return '';

  // Create a temporary element to use the browser's built-in decoder
  // Replace encoded HTML tags with actual tags
  return (
    html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Handle numeric HTML entities
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      // Handle hex HTML entities
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
  );
};

/**
 * Parses HTML content to extract headings and generate a table of contents
 * @param {string} content - HTML content string (may contain encoded HTML entities)
 * @returns {Object} - Object containing updated content with heading IDs and table of contents
 */
const parseHeadings = content => {
  if (!content) return { content: '', tableOfContents: [] };

  // Decode HTML entities before parsing
  const decodedContent = decodeHtmlEntities(content);

  // Create a new Cheerio instance with the decoded content
  const $ = cheerio.load(decodedContent, { decodeEntities: false });
  const tableOfContents = [];
  // console.warn('$: ', $);
  try {
    // Find all h1, h2, and h3 elements
    $('h1, h2, h3').each(function() {
      // Use function() instead of arrow function to maintain proper 'this' context
      const $element = $(this);
      const text = $element.text().trim();

      // Skip empty headings
      if (!text) return;

      // For debugging only - remove in production
      // console.warn('Found heading: ', text);

      // Generate ID from text (lowercase, replace spaces with hyphens, remove special chars)
      // For non-Latin scripts like Arabic, we need a different approach
      // First check if the text contains mostly non-Latin characters
      const isNonLatin = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u1EE00-\u1EEFF]/.test(
        text
      );

      let id;
      if (isNonLatin) {
        // For Arabic and other non-Latin text, create a unique ID based on the text
        // Use a simple hash function to create a unique ID
        const simpleHash = str => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
          }
          return Math.abs(hash).toString(36);
        };

        // Create ID with prefix for better readability
        id = 'heading-' + simpleHash(text);
      } else {
        // For Latin text, use the original approach
        id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
      }

      // Add ID attribute to the heading element
      $element.attr('id', id);

      // Determine heading level
      const tagName = $element.prop('tagName').toLowerCase();
      const level = parseInt(tagName.charAt(1), 10);

      // Add to table of contents
      tableOfContents.push({
        id,
        text,
        level
      });
    });
  } catch (error) {
    // Silent error handling in production
    console.error('Error parsing headings:', error.message);
  }

  // Return updated content and table of contents
  // We always return the HTML as is, since we've already decoded it for processing
  // The IDs have been added to the heading elements in the decoded content
  const updatedContent = $.html();

  return {
    content: updatedContent,
    tableOfContents
  };
};

module.exports = { parseHeadings };
