# S3 prices changes

Historical S3 prices cannot be extracted from the API. I tried to use the filter 'EffectiveDate' and got nothing returned. I wanted this page to have all the historical prices of S3 directly from an API call but no. So I will rely on the [AWS price reduction blog](https://aws.amazon.com/blogs/aws/category/price-reduction/) and [this website](https://aws.amazon.com/blogs/aws/aws-storage-update-s3-glacier-price-reductions/). 

```js
const s3PricingOverTime = [
  {
    date: new Date("2006-03-14"),
    price: 0.15,
    notes: "Initial announcement",
    link: "https://aws.amazon.com/blogs/aws/amazon_s3/"
  },
  {
    date: new Date("2008-10-08"),
    price: 0.15,
    notes: "Tiered pricing introduced",
    link: "https://aws.amazon.com/blogs/aws/amazon-s3-now/"
  },
  {
    date: new Date("2009-12-07"),
    price: 0.15,
    notes: "Even more tiering. No change to base price.",
    link: "https://aws.amazon.com/blogs/aws/aws-price-reductions/"
  },
  {
    date: new Date("2010-11-01"),
    price: 0.14,
    notes: "First discount to the base price. Changes in tiering.",
    link: "https://aws.amazon.com/blogs/aws/what-can-i-say-another-amazon-s3-price-reduction/"
  },
  {
    date: new Date("2012-02-06"),
    price: 0.125,
    notes: "Some more discount on the base price.",
    link: "https://aws.amazon.com/blogs/aws/amazon-s3-price-reduction/"
  },
  {
    date: new Date("2012-11-29"),
    price: 0.095,
    notes: "We are under the cents.",
    link: "https://aws.amazon.com/blogs/aws/amazon-s3-price-reduction-december-1-2012/"
  },
  {
    date: new Date("2014-01-21"),
    price: 0.085,
    notes: "AWS is behaving, correctly, like a commodity provider.",
    link: "https://aws.amazon.com/blogs/aws/aws-update-new-m3-features-reduced-ebs-prices-reduced-s3-prices/"
  },
  {
    date: new Date("2014-03-26"),
    price: 0.03,
    notes: "Huge discount. What happened?",
    link: "https://aws.amazon.com/blogs/aws/aws-price-reduction-42-ec2-s3-rds-elasticache-and-elastic-mapreduce/"
  },
  {
    date: new Date("2016-11-21"),
    price: 0.023,
    notes: "Last discount.",
    link: "https://aws.amazon.com/blogs/aws/aws-storage-update-s3-glacier-price-reductions/"
  },
  {
    date: new Date("2017-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2018-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2019-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2020-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2021-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2022-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2023-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2024-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2025-01-01"),
    price: 0.023,
    notes: "No changes.",
  },
  {
    date: new Date("2025-08-08"),
    price: 0.023,
    notes: "No change.",
  }
]
```

```js
Inputs.table(s3PricingOverTime, {
  format: {
    link: (url) => htl.html`<a href="${url}" target="_blank" rel="noopener">Link</a>`
  }
})
```


```js
Plot.plot({
  x: { type: "utc", label: "Date", nice: true },
  y: {domain: [0, 0.2], nice: true},
  marks: [
    Plot.lineY( s3PricingOverTime, {
        x: "date",
        y: "price",
        tip: true,
      }),
  ]
})
```

# Just the last 5 years
```js

Plot.plot({
  x: { type: "utc", label: "Date", domain: [new Date("2020-01-01"), new Date()], nice: true, grid: true },
  y: {domain: [0, 0.03], nice: true},
  marks: [
    Plot.lineY( s3PricingOverTime, {
        x: "date",
        y: "price",
        tip: true,
      }),
  ]
})
```


# FinOps Playbook: Challenging S3 Pricing Assumptions 

## Problem
S3 Standard price is **$0.023/GB/month and has not changed since 2016**.  
In that same time, disk prices have plummeted: you can buy professional storage today for the equivalent of **$0.003/GB/month**. (price per GB divided by 36 months of warrantied usage)  
That’s **7.5× cheaper**.  

So why hasn’t AWS dropped S3 prices in nearly a decade? Because they don’t need to. Customers accept S3 as the default, and AWS captures the margin.  

## Reality Check
S3 is more than just a disk. You’re paying for replication, durability, resilience, APIs, and zero-ops.  
But here’s the truth: **most S3 data is never read again.** Paying premium “instant-access” rates for cold data is burning money.  

## FinOps Insight
- The fact that **Glacier is $0.004/GB/month** proves AWS can offer near-hardware economics when access speed is relaxed.  
- That makes S3 Standard less about cost, more about **convenience and inertia**.  
- Leaving data in Standard by default is effectively paying an “AWS storage tax.”  

## Action Steps
1. **Interrogate usage**: How much of your S3 data was accessed in the last 30–90 days?  
2. **Challenge the default**: Stop assuming S3 Standard is the right answer.  
3. **Automate tiering**: Lifecycle policies should be the norm, not the exception.  
4. **Report the waste**: Show stakeholders how much could be saved by moving to IA or Glacier.  

## Key Takeaway
If you don’t actively manage S3, AWS will happily charge you 7× the cost of storage.  
FinOps leaders must push back, or the “S3 Tax” will silently drain budgets year after year.  

[Source of the disk prices](https://diskprices.com/?locale=us&condition=new&units=gb&capacity=500-20000&disk_types=u2)