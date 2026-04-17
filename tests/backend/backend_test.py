import requests
import sys
import json
from datetime import datetime

class SistemaMaestroAPITester:
    def __init__(self, base_url="https://cervaco-platform.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_credentials = {
            "email": "admin@sistemamaestro.com",
            "password": "admin123"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response text: {response.text[:200]}")

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION FLOW")
        print("="*50)
        
        # Test login with admin credentials
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=self.admin_credentials
        )
        
        if not success:
            print("❌ Admin login failed - stopping auth tests")
            return False
            
        # Test get current user
        self.run_test(
            "Get Current User",
            "GET", 
            "auth/me",
            200
        )
        
        # Test logout
        self.run_test(
            "Logout",
            "POST",
            "auth/logout", 
            200
        )
        
        return True

    def test_projects_flow(self):
        """Test project creation and management"""
        print("\n" + "="*50)
        print("TESTING PROJECTS FLOW")
        print("="*50)
        
        # Login first
        login_success, _ = self.run_test(
            "Login for Projects",
            "POST",
            "auth/login",
            200,
            data=self.admin_credentials
        )
        
        if not login_success:
            print("❌ Login failed - skipping project tests")
            return False
        
        # Test creating project with text input
        text_project_data = {
            "input_type": "text",
            "input_content": "Quiero crear una plataforma de e-learning para enseñar programación"
        }
        
        success, project_response = self.run_test(
            "Create Text Project",
            "POST",
            "projects",
            200,
            data=text_project_data
        )
        
        text_project_id = None
        if success and 'project_id' in project_response:
            text_project_id = project_response['project_id']
            print(f"   Created project ID: {text_project_id}")
        
        # Test creating project with URL input
        url_project_data = {
            "input_type": "url", 
            "input_content": "https://stripe.com"
        }
        
        success, url_project_response = self.run_test(
            "Create URL Project (Stripe.com)",
            "POST",
            "projects",
            200,
            data=url_project_data
        )
        
        url_project_id = None
        if success and 'project_id' in url_project_response:
            url_project_id = url_project_response['project_id']
            print(f"   Created URL project ID: {url_project_id}")
        
        # Test getting all projects
        self.run_test(
            "Get All Projects",
            "GET",
            "projects",
            200
        )
        
        # Test getting specific project
        if text_project_id:
            self.run_test(
                "Get Specific Project",
                "GET",
                f"projects/{text_project_id}",
                200
            )
            
            # Test blueprint generation (should fail for free plan)
            self.run_test(
                "Generate Blueprint (Free Plan)",
                "POST",
                f"projects/{text_project_id}/blueprint",
                403  # Should fail for free plan
            )
        
        return True

    def test_opportunities(self):
        """Test opportunities endpoint"""
        print("\n" + "="*50)
        print("TESTING OPPORTUNITIES")
        print("="*50)
        
        # Login first
        login_success, _ = self.run_test(
            "Login for Opportunities",
            "POST",
            "auth/login",
            200,
            data=self.admin_credentials
        )
        
        if not login_success:
            print("❌ Login failed - skipping opportunities tests")
            return False
        
        # Test getting opportunities
        self.run_test(
            "Get Opportunities",
            "GET",
            "opportunities",
            200
        )
        
        return True

    def test_billing(self):
        """Test billing endpoints"""
        print("\n" + "="*50)
        print("TESTING BILLING")
        print("="*50)
        
        # Login first
        login_success, _ = self.run_test(
            "Login for Billing",
            "POST",
            "auth/login",
            200,
            data=self.admin_credentials
        )
        
        if not login_success:
            print("❌ Login failed - skipping billing tests")
            return False
        
        # Test getting billing info
        self.run_test(
            "Get Billing Info",
            "GET",
            "user/billing",
            200
        )
        
        # Test getting user stats
        self.run_test(
            "Get User Stats",
            "GET",
            "user/stats",
            200
        )
        
        return True

    def test_newsletter(self):
        """Test newsletter subscription"""
        print("\n" + "="*50)
        print("TESTING NEWSLETTER")
        print("="*50)
        
        # Test newsletter subscription
        newsletter_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        }
        
        self.run_test(
            "Newsletter Subscription",
            "POST",
            "newsletter/subscribe",
            200,
            data=newsletter_data
        )
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Sistema Maestro API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"📧 Admin Email: {self.admin_credentials['email']}")
        
        # Run test suites
        self.test_newsletter()
        self.test_auth_flow()
        self.test_projects_flow()
        self.test_opportunities()
        self.test_billing()
        
        # Print final results
        print("\n" + "="*60)
        print("📊 FINAL TEST RESULTS")
        print("="*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = SistemaMaestroAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())