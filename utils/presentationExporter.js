
// server/utils/presentationExporter.js
import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { convert } from 'html-to-text';
import { JSDOM } from 'jsdom';

class PresentationExporter {
  // Export to PowerPoint
  async exportToPPTX(deck, outputPath) {
    const pres = new pptxgen();
    
    // Set presentation properties
    pres.title = deck.title;
    pres.subject = `${deck.sector} Pitch Deck`;
    pres.company = "PitchDeck Builder";
    
    // Add slides
    for (const slide of deck.slides) {
      const pptxSlide = pres.addSlide();
      
      // Parse HTML content
      const dom = new JSDOM(slide.content);
      const document = dom.window.document;
      
      // Extract title
      const titleElement = document.querySelector('h1, h2');
      const title = titleElement ? titleElement.textContent : slide.title;
      
      // Extract text content
      const textContent = convert(slide.content, {
        wordwrap: 130,
        preserveNewlines: true
      });
      
      // Add title
      pptxSlide.addText(title, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 1,
        fontSize: 24,
        bold: true,
        color: '363636'
      });
      
      // Add content
      pptxSlide.addText(textContent, {
        x: 0.5,
        y: 1.7,
        w: '90%',
        h: 4,
        fontSize: 14,
        color: '666666'
      });
      
      // Add slide number
      pptxSlide.addText(`${slide.order + 1}`, {
        x: '90%',
        y: '95%',
        w: 0.5,
        h: 0.3,
        fontSize: 10,
        color: 'AAAAAA'
      });
    }
    
    // Save file
    await pres.writeFile(outputPath);
    return outputPath;
  }
  
  // Export to PDF
  async exportToPDF(deck, outputPath) {
    // Create HTML version first
    const htmlPath = outputPath.replace('.pdf', '.html');
    await this.exportToHTML(deck, htmlPath);
    
    // Use Puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    await browser.close();
    
    // Delete temporary HTML file
    fs.unlinkSync(htmlPath);
    
    return outputPath;
  }
  
  // Export to HTML (web presentation)
  async exportToHTML(deck, outputPath) {
    // Create RevealJS-based presentation
    const slidesHtml = deck.slides.map(slide => `
      <section>
        <div class="slide-content">
          ${slide.content}
        </div>
      </section>
    `).join('');
    
    const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${deck.title}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reset.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/theme/white.min.css">
        <style>
          .slide-content {
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1, h2 {
            color: #333;
            margin-bottom: 0.5em;
          }
          p {
            color: #666;
            margin-bottom: 1em;
          }
          ul, ol {
            margin-left: 1em;
          }
          .footnote {
            font-size: 0.8em;
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="reveal">
          <div class="slides">
            ${slidesHtml}
          </div>
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.js"></script>
        <script>
          Reveal.initialize({
            controls: true,
            progress: true,
            history: true,
            center: true,
            transition: 'slide',
            hash: true
          });
        </script>
      </body>
      </html>`;
    
    // Write HTML to file
    fs.writeFileSync(outputPath, html);
    return outputPath;
  }
}

export default PresentationExporter;