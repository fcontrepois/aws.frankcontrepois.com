---
title: Explore AWS pricing
theme: deep-space
toc: false
---

<style>
.discovery {max-width: 1000px;}
.discovery .eyebrow {font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--theme-foreground-muted);}
.discovery h1 {font-size: clamp(2.4rem, 5vw, 4rem); line-height: 1.08; max-width: 800px; margin: 1rem 0;}
.discovery .intro {font-size: 1.2rem; max-width: 660px; color: var(--theme-foreground-muted);}
.discovery .featured {margin: 2.5rem 0; padding: clamp(1.25rem, 4vw, 2.5rem); border: 1px solid var(--theme-foreground-faintest); border-left: 4px solid #69c5d5; border-radius: 0.5rem; background: var(--theme-background-alt);}
.discovery .featured h2 {margin-top: 0.6rem; font-size: 1.8rem;}
.discovery .action {display: inline-block; padding: 0.7rem 1rem; border-radius: 0.3rem; background: #a9e2ec; color: #10252d; font-weight: 650; text-decoration: none;}
.discovery a:focus-visible {outline: 3px solid #69c5d5; outline-offset: 5px;}
.discovery .story {display: grid; grid-template-columns: 3rem 1fr; gap: 1rem; padding: 1.5rem 0; border-top: 1px solid var(--theme-foreground-faintest);}
.discovery .number {font-size: 1.5rem; color: var(--theme-foreground-muted); font-variant-numeric: tabular-nums;}
.discovery .story h3 {margin: 0; font-size: 1.3rem;}
.discovery .story p {max-width: 660px; margin: 0.6rem 0;}
.discovery .closing {margin-top: 2rem; color: var(--theme-foreground-muted);}
</style>

<div class="discovery">

<p class="eyebrow">AWS pricing, explored · By Frank Contrepois</p>

# Your AWS bill has a few plot twists.

<p class="intro">A newer instance might cost less. A cheaper region might be missing a service you need. And your bill can rise even when AWS hasn't changed its price.</p>

Follow a question. Play with the data. Find something worth checking in your own AWS setup.

<section class="featured" aria-labelledby="start-here">
<p class="eyebrow">Start here · Compare your options</p>
<h2 id="start-here">Still paying for yesterday's instance?</h2>
<p>Pick an instance you use, then compare its price with other generations, processors, and sizes. See which options deserve a closer look before you plan a change.</p>
<p>Explore EC2, RDS, ElastiCache, and OpenSearch, with every price difference measured against your selected instance.</p>
<a class="action" href="./comparisons/">Find an instance to compare →</a>
</section>

## Three more questions worth asking

<section class="story" aria-labelledby="region-question">
<span class="number" aria-hidden="true">01</span>
<div>
<h3 id="region-question">Same cloud. Different postcode. Different price?</h3>
<p>A region is a pricing decision as well as a location. Compare S3 and EC2 prices across regions, then explore which services and instance families are available there.</p>
<a href="./regions">Explore regions &amp; pricing →</a>
</div>
</section>

<section class="story" aria-labelledby="currency-question">
<span class="number" aria-hidden="true">02</span>
<div>
<h3 id="currency-question">What if AWS changes nothing, but your bill goes up?</h3>
<p>Hold a monthly AWS invoice at $100. Change the currency and the dates. See how exchange rates alone can move the cost in your local currency.</p>
<a href="./fx-exposure">Follow the currency effect →</a>
</div>
</section>

<section class="story" aria-labelledby="history-question">
<span class="number" aria-hidden="true">03</span>
<div>
<h3 id="history-question">How did S3 get from $0.15 to $0.023?</h3>
<p>Follow a curated timeline of S3 storage pricing announcements, from its 2006 launch through the 2016 reduction. Some announcements changed the base price; others changed the tiers.</p>
<a href="./s3PriceHistory">Read the S3 price story →</a>
</div>
</section>

<p class="closing">I’m Frank Contrepois. I turn AWS pricing data into graphs and comparisons to make the tradeoffs easier to see. These are starting points for investigation: list prices tell part of the story; your usage, discounts, and technical requirements tell the rest.</p>

</div>
