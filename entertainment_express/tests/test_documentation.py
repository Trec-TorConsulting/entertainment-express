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
        self.assertIn("Getting Started & Setup", cat_names)
        self.assertIn("Owner Operations & Business Cockpit", cat_names)
        self.assertIn("Field Crew & Mobile Playbook", cat_names)
        self.assertIn("Client & Event Host Portal", cat_names)

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

    def test_search_documentation_owner_role_filter(self):
        res = search_documentation(role="Owner")
        self.assertIn("results", res)
        self.assertGreaterEqual(res["results_count"], 7)
        for r in res["results"]:
            self.assertIn(r["role"], ("Owner", "All Users"))

    def test_search_documentation_crew_role_filter(self):
        res = search_documentation(role="Crew")
        self.assertIn("results", res)
        self.assertGreaterEqual(res["results_count"], 7)
        for r in res["results"]:
            self.assertIn(r["role"], ("Crew", "All Users"))

    def test_search_documentation_client_role_filter(self):
        res = search_documentation(role="Client")
        self.assertIn("results", res)
        self.assertGreaterEqual(res["results_count"], 6)
        for r in res["results"]:
            self.assertIn(r["role"], ("Client", "All Users"))

    def test_search_documentation_category_slug_and_name_filter(self):
        # 1. Test by category slug
        res_api_slug = search_documentation(category="api-integrations")
        self.assertIn("results", res_api_slug)
        self.assertGreaterEqual(res_api_slug["results_count"], 2)
        for r in res_api_slug["results"]:
            self.assertEqual(r["category"], "APIs, Hardware & Webhooks")

        res_owner_slug = search_documentation(category="owner-operations")
        self.assertGreaterEqual(res_owner_slug["results_count"], 7)
        for r in res_owner_slug["results"]:
            self.assertEqual(r["category"], "Owner Operations & Business Cockpit")

        res_client_slug = search_documentation(category="client-experience")
        self.assertGreaterEqual(res_client_slug["results_count"], 8)
        for r in res_client_slug["results"]:
            self.assertEqual(r["category"], "Client & Event Host Portal")

        res_crew_slug = search_documentation(category="field-crew")
        self.assertGreaterEqual(res_crew_slug["results_count"], 8)
        for r in res_crew_slug["results"]:
            self.assertEqual(r["category"], "Field Crew & Mobile Playbook")

        res_getting_started = search_documentation(category="getting-started")
        self.assertGreaterEqual(res_getting_started["results_count"], 5)
        for r in res_getting_started["results"]:
            self.assertEqual(r["category"], "Getting Started & Setup")

        # 2. Test by exact category name
        res_name = search_documentation(category="APIs, Hardware & Webhooks")
        self.assertGreaterEqual(res_name["results_count"], 2)
        for r in res_name["results"]:
            self.assertEqual(r["category"], "APIs, Hardware & Webhooks")

    def test_seed_documentation_idempotency(self):
        # Run seed twice to confirm no duplicate error or failure
        seed_documentation_data()
        cats = get_documentation_categories()
        self.assertIsNotNone(cats)

