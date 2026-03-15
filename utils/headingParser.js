const cheerio = require('cheerio');

const decodeHtmlEntities = html => {
  if (!html) return '';

  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
};

const parseHeadings = content => {
  if (!content) return { content: '', tableOfContents: [] };

  const decodedContent = decodeHtmlEntities(content);
  const $ = cheerio.load(decodedContent, { decodeEntities: false });
  const tableOfContents = [];

  try {
    $('h1, h2, h3').each(function () {
      const $element = $(this);
      const text = $element.text().trim();

      if (!text) return;

      const isNonLatin =
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u1EE00-\u1EEFF]/.test(text);

      let id;
      if (isNonLatin) {
        const simpleHash = str => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          return Math.abs(hash).toString(36);
        };
        id = `heading-${simpleHash(text)}`;
      } else {
        id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }

      $element.attr('id', id);

      const tagName = $element.prop('tagName').toLowerCase();
      const level = parseInt(tagName.charAt(1), 10);

      tableOfContents.push({ id, text, level });
    });
  } catch (error) {
    // Silent error handling in production
  }

  const updatedContent = $.html();

  return { content: updatedContent, tableOfContents };
};

module.exports = { parseHeadings };
