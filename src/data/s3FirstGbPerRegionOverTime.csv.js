// MIT License
// Copyright (c) 2025 Frank Contrepois
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Description: 
//   This script fetches the AWS price reduction blog RSS feed, extracts all posts related to S3 price reductions,
//   and prints a CSV with the date, title, link, summary, initial price, and new price for each S3 discount post.
//
// Example usage:
//   node s3_price_reductions.js
//
//   Output:
//   Date,Title,Link,Summary,Initial Price,New Price
//   2023-01-01,"Amazon S3 Price Reduction in Region X",https://aws.amazon.com/...,"We are reducing the price of S3 in...",$0.15/GB,$0.12/GB

import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

// Escape CSV fields
function csvEscape(str) {
  if (str == null) return '';
  str = str.replace(/"/g, '""');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str}"`;
  }
  return str;
}

// Extract initial and new prices from description text
function extractPrices(description) {
  // Remove HTML tags
  const text = description.replace(/<[^>]+>/g, ' ');

  // Find all price mentions like $0.023 per GB, $0.15/GB, etc.
  const priceRegex = /\$\d+(\.\d+)?\s*\/?\s*GB/gi;
  const prices = text.match(priceRegex);

  // Try to find "from $X to $Y" or "was $X, now $Y"
  let initial = '', next = '';
  const fromToRegex = /(?:from|was)\s*\$?(\d+(\.\d+)?)\s*\/?\s*GB.*?(?:to|now)\s*\$?(\d+(\.\d+)?)\s*\/?\s*GB/gi;
  const match = fromToRegex.exec(text);
  if (match) {
    initial = `$${match[1]}/GB`;
    next = `$${match[3]}/GB`;
  } else if (prices && prices.length >= 2) {
    initial = prices[0];
    next = prices[1];
  } else if (prices && prices.length === 1) {
    initial = prices[0];
    next = '';
  }
  return { initial, next };
}

async function main() {
  const FEED_URL = 'https://aws.amazon.com/blogs/aws/category/price-reduction/feed/';
  const res = await fetch(FEED_URL);
  if (!res.ok) {
    console.error('Failed to fetch feed:', res.statusText);
    process.exit(1);
  }
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(xml);

  // RSS 2.0 format: feed.rss.channel.item
  const items = feed.rss && feed.rss.channel && feed.rss.channel.item
    ? feed.rss.channel.item
    : [];

  // Filter for S3 price reductions
  const s3Items = items.filter(item => {
    const title = item.title || '';
    const desc = item.description || '';
    return (
      title.toLowerCase().includes('s3') ||
      desc.toLowerCase().includes('s3')
    );
  });

  if (s3Items.length === 0) {
    console.log('No S3 price reduction posts found.');
    return;
  }

  // Prepare rows for the CSV
  const rows = s3Items.map(item => {
    const date = (item.pubDate || '').split(' ').slice(1, 4).join(' '); // e.g. "08 Aug 2025"
    const title = item.title || '';
    const link = item.link || '';
    const summary = (item.description || '').replace(/<[^>]+>/g, '').slice(0, 80) + '...';
    const { initial, next } = extractPrices(item.description || '');
    return [date, title, link, summary, initial, next];
  });

  // Print CSV header
  console.log('Date,Title,Link,Summary,Initial Price,New Price');
  // Print CSV rows
  rows.forEach(row => {
    console.log(row.map(csvEscape).join(','));
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

