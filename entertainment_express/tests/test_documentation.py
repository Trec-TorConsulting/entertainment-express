import unittest
import frappe
from entertainment_express.api.docs import search_documentation, get_documentation_categories
from entertainment_express.setup.documentation_seed import seed_documentation_data, SEED_CATEGORIES, SEED_ARTICLES

class TestDocumentationPortal(unittest.TestCase):
    def setUp(self):
        seed_documentation_data()

    def test_get_documentation_categories(self):
        cats = get_documentation_categories()
        self.assertIsInstance(cats, list)
        self.assertGreaterEqual(len(cats), 5)
        cat_names = [c["category_name"] for c in cats]
        self.assertIn("Getting Started & Onboarding", cat_names)
        self.assertIn("Owner Operations & Inventory", cat_names)
        self.assertIn("Field Crew & Mobile Playbook", cat_names)

    def test_search_documentation_all(self):
        res = search_documentation()
        self.assertIn("results", res)
        self.assertGreaterEqual(res["results_count"], len(SEED_ARTICLES))

    def test_search_documentation_keyword(self):
        res = search_documentation(query="white-label")
        self.assertIn("results", res)
        self.assertGreater(res["results_count"], 0)
        found_titles = [r["title"] for r in res["results"]]
        self.assertTrue(any("White-Label" in t or "Branding" in t for t in found_titles))

    def test_search_documentation_role_filter(self):
        res = search_documentation(role="Crew")
        self.assertIn("results", res)
        self.assertGreater(res["results_count"], 0)

    def test_seed_documentation_idempotency(self):
        # Run seed twice to confirm no duplicate error or failure
        seed_documentation_data()
        cats = get_documentation_categories()
        self.assertIsNotNone(cats)
