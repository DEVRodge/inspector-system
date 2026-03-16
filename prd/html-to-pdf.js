#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  const htmlPath = 'file://' + path.join(__dirname, 'prd-inspector-equipment-inspection-system.html');
  const pdfPath = path.join(__dirname, 'prd-inspector-equipment-inspection-system.pdf');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  });
  await browser.close();
  console.log('PDF 已生成:', pdfPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
