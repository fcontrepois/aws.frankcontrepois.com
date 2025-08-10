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
  x: { type: "utc", label: "Date" },
  marks: [
    Plot.lineY( s3PricingOverTime, {
        x: "date",
        y: "price",
      }),
  ]
})
```

# Just the last 5 years
```js

Plot.plot({
  x: { type: "utc", label: "Date", domain: [new Date("2020-01-01"), new Date()] },
  y: {domain: [0, 0.03]},
  marks: [
    Plot.lineY( s3PricingOverTime, {
        x: "date",
        y: "price",
      }),
  ]
})
```


