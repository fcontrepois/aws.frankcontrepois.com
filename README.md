The live website is at https://aws.frankcontrepois.com

# AWS Pricing Graphs

A visual exploration of AWS pricing data, built with [Observable Framework](https://observablehq.com/framework).

## What is this?

This project takes raw AWS pricing data and turns it into clear, interactive graphs. The goal: help you make smarter, faster decisions about where and how to run your AWS workloads.

## Features

- **S3 Storage Price by Region:**  
  Instantly see which AWS regions offer the cheapest (and most expensive) S3 storage for the first GB.  
  - Median price: **$0.025/h**.  
  - Anything above? You’d better have a good reason (think: GovCloud, legal, or compliance needs).

- **t3.micro On-Demand Cost Comparison:**  
  Compare the hourly cost of running a t3.micro instance across all regions.  
  - Median price: **$0.0121/h**.  
  - Outliers often reflect local factors like electricity, climate, or regulation.

- **Number of Services per Region:**  
  Visualize AWS’s regional service coverage at a glance.  
  - Each square = one service.  
  - Spot the gaps and the overachievers.

- **Instance Family & Region Matrix:**  
  See which EC2 instance families are available in which regions, with color-coded legends for clarity.

- **Service-to-Region Mapping:**  
  A detailed, scrollable map showing which AWS services are available in each region.

## Why does this exist?

AWS pricing is famously opaque. This project aims to cut through the noise, making it easy to:
- Spot regional pricing anomalies
- Choose the best region for your needs
- Understand AWS’s global service distribution

## How it works

- Data: Pulled from AWS’s public pricing endpoints, processed into CSVs.
- Visualization: Built with Observable Plot and D3.js for interactive, responsive charts.
- Everything is open and reproducible.

## Quick Start

1. Clone the repo:
   ```sh
   git clone https://github.com/fcontrepois/aws.frankcontrepois.com.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run locally (using Observable Framework):
   ```sh
   npm start
   ```
4. Or, just [visit the live site](https://aws.frankcontrepois.com/) for the latest graphs.

## Contributing

- Found a bug? Have a feature idea? Open an issue or PR.
- Data nerds, AWS obsessives, and visualization enthusiasts all welcome.

## License

MIT

---

*Built by [Frank Contrepois](https://github.com/fcontrepois). Inspired by a love of clarity, skepticism about cloud pricing, and a fondness for a good graph.*
