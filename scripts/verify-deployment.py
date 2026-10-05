"""Verify that canonical comparator routes serve complete monthly catalogues."""
import csv
import io
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

SOURCE = 'https://s3.us-east-1.amazonaws.com/data.frankcontrepois.com/FinOpsGuyAwsPricingElaboratedData/'
SITE = 'https://aws.frankcontrepois.com/'
SERVICES = ('ec2', 'rds', 'elasticache', 'opensearch')


def fetch(url):
    with urlopen(Request(url, headers={'Cache-Control': 'no-cache'}), timeout=30) as response:
        return response.read().decode('utf-8')


def validate_catalog(text, month):
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows or {r.get('as_of_month') for r in rows} != {month}:
        raise ValueError(f'Catalogue is empty or not entirely from {month}')
    keys = [r.get('catalog_key') for r in rows]
    if not all(keys) or len(keys) != len(set(keys)):
        raise ValueError('Catalogue contains empty or duplicate keys')
    return rows


def asset_url(html, page, service):
    # Read the FileAttachment registration, not an arbitrary CSV-looking link.
    registrations = re.findall(r'registerFile\("[^"\n]*",\s*(\{[^\n]*?\})\);', html)
    for registration in registrations:
        metadata = json.loads(registration)
        if metadata.get('name', '').endswith(f'/data/{service}-family-catalog.csv'):
            url = urljoin(page, metadata['path'])
            if urlparse(url).netloc != urlparse(SITE).netloc:
                raise ValueError('Unexpected external catalogue asset')
            return url
    raise ValueError(f'No {service} catalogue registration: route may be a fallback page')


def source_catalogues(month):
    expected = {}
    for service in SERVICES:
        name = f'{service}-family-catalog.csv'
        dated = fetch(SOURCE + month + '/' + name)
        latest = fetch(SOURCE + name)
        rows = validate_catalog(dated, month)
        if dated != latest:
            raise ValueError(f'{service}: latest alias differs from dated {month} catalogue')
        expected[service] = (dated, rows[0]['family'])
    return expected


def verify_site(month, expected):
    for service, (source, family) in expected.items():
        page = urljoin(SITE, f'comparisons/{service}/{family}')
        html = fetch(page)
        deployed = fetch(asset_url(html, page, service))
        rows = validate_catalog(deployed, month)
        if deployed.strip() != source.strip():
            raise ValueError(f'{service}: served CSV differs from {month} source')
        print(f'{service}: verified {month}, {len(rows)} rows at {page}', flush=True)


def main():
    month = os.environ.get('SNAPSHOT_MONTH') or datetime.now(timezone.utc).strftime('%Y-%m')
    if not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', month):
        raise ValueError('SNAPSHOT_MONTH must be YYYY-MM')
    expected = source_catalogues(month)
    attempts = 3
    for attempt in range(attempts):
        try:
            verify_site(month, expected)
            return
        except Exception as error:
            print(f'Freshness check {attempt + 1}/{attempts}: {error}', file=sys.stderr, flush=True)
            if attempt + 1 == attempts:
                raise RuntimeError(f'Website did not publish verified {month} catalogues') from None
            time.sleep(60)


if __name__ == '__main__':
    main()
