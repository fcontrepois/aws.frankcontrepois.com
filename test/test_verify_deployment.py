import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('refresh', Path(__file__).resolve().parents[1] / 'scripts/verify-deployment.py')
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)


class WebsiteRefreshTests(unittest.TestCase):
    def test_all_service_fixtures_use_their_published_identity(self):
        import csv
        import io
        for service in refresh.SERVICES:
            with self.subTest(service=service):
                text = (Path(__file__).parent / 'fixtures' / f'{service}-family-catalog.csv').read_text()
                month = next(csv.DictReader(io.StringIO(text)))['as_of_month']
                refresh.validate_catalog(text, month, 'instance_type' if service == 'ec2' else 'catalog_key')

    def test_stale_mixed_empty_and_duplicate_catalogues_fail(self):
        for data in ('', 'as_of_month,catalog_key\n2026-09,a\n',
                     'as_of_month,catalog_key\n2026-10,a\n2026-09,b\n',
                     'as_of_month,catalog_key\n2026-10,a\n2026-10,a\n'):
            with self.subTest(data=data), self.assertRaises(ValueError):
                refresh.validate_catalog(data, '2026-10')

    def test_fallback_page_fails(self):
        with self.assertRaises(ValueError):
            refresh.asset_url('<html>Home page</html>', refresh.SITE, 'ec2')

    def test_real_registration_resolves_relative_asset(self):
        html = 'registerFile("../../data/ec2-family-catalog.csv", {"name":"../../data/ec2-family-catalog.csv","path":"../../_file/data/ec2-family-catalog.abc.csv"});'
        self.assertEqual(refresh.asset_url(html, refresh.SITE + 'comparisons/ec2/m', 'ec2'),
                         refresh.SITE + '_file/data/ec2-family-catalog.abc.csv')

    def test_partial_publication_fails_before_deployment(self):
        dated = 'as_of_month,instance_type,family\n2026-10,a,m\n'
        with patch.object(refresh, 'fetch', side_effect=[dated, dated.replace('2026-10', '2026-09')]):
            with self.assertRaisesRegex(ValueError, 'latest alias differs'):
                refresh.source_catalogues('2026-10')

    def test_same_month_wrong_contents_fail(self):
        source = 'as_of_month,instance_type,family\n2026-10,a,m\n'
        with patch.object(refresh, 'fetch', side_effect=['html', source.replace(',a,', ',b,')]), patch.object(refresh, 'asset_url', return_value=refresh.SITE):
            with self.assertRaisesRegex(ValueError, 'differs'):
                refresh.verify_site('2026-10', {'ec2': (source, 'm')})


if __name__ == '__main__':
    unittest.main()
