#!/usr/bin/env python3
"""
Backend Authentication System Test Suite
Tests the JWT-based authentication system with MongoDB
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://auth-rescue-2.preview.emergentagent.com/api"

class AuthenticationTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
    
    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Basic API Connectivity", 
                    True, 
                    f"API responding with: {data.get('message', 'No message')}"
                )
                return True
            else:
                self.log_test(
                    "Basic API Connectivity", 
                    False, 
                    f"HTTP {response.status_code}", 
                    response.text
                )
                return False
        except Exception as e:
            self.log_test("Basic API Connectivity", False, f"Connection error: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin login with admin@musitech.com / admin"""
        try:
            login_data = {
                "email": "admin@musitech.com",
                "password": "admin"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ["access_token", "token_type", "expires_in", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "Admin Login - Response Structure", 
                        False, 
                        f"Missing fields: {missing_fields}", 
                        data
                    )
                    return False
                
                # Verify user data
                user_data = data.get("user", {})
                if user_data.get("email") != "admin@musitech.com":
                    self.log_test(
                        "Admin Login - User Email", 
                        False, 
                        f"Expected admin@musitech.com, got {user_data.get('email')}", 
                        user_data
                    )
                    return False
                
                if user_data.get("role") != "admin":
                    self.log_test(
                        "Admin Login - User Role", 
                        False, 
                        f"Expected admin role, got {user_data.get('role')}", 
                        user_data
                    )
                    return False
                
                # Store token for further tests
                self.admin_token = data["access_token"]
                
                self.log_test(
                    "Admin Login", 
                    True, 
                    f"Successfully logged in as {user_data.get('email')} with role {user_data.get('role')}"
                )
                return True
                
            else:
                self.log_test(
                    "Admin Login", 
                    False, 
                    f"HTTP {response.status_code}", 
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Request error: {str(e)}")
            return False
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        try:
            login_data = {
                "email": "admin@musitech.com",
                "password": "wrongpassword"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                data = response.json()
                if "Invalid email or password" in data.get("detail", ""):
                    self.log_test(
                        "Invalid Credentials Test", 
                        True, 
                        "Correctly rejected invalid credentials with 401"
                    )
                    return True
                else:
                    self.log_test(
                        "Invalid Credentials Test", 
                        False, 
                        f"Wrong error message: {data.get('detail')}", 
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Invalid Credentials Test", 
                    False, 
                    f"Expected 401, got HTTP {response.status_code}", 
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Invalid Credentials Test", False, f"Request error: {str(e)}")
            return False
    
    def test_profile_endpoint_with_token(self):
        """Test GET /api/auth/profile with valid token"""
        if not self.admin_token:
            self.log_test("Profile Endpoint Test", False, "No admin token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{self.base_url}/auth/profile", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify user data
                if data.get("email") != "admin@musitech.com":
                    self.log_test(
                        "Profile Endpoint Test", 
                        False, 
                        f"Expected admin@musitech.com, got {data.get('email')}", 
                        data
                    )
                    return False
                
                if data.get("role") != "admin":
                    self.log_test(
                        "Profile Endpoint Test", 
                        False, 
                        f"Expected admin role, got {data.get('role')}", 
                        data
                    )
                    return False
                
                self.log_test(
                    "Profile Endpoint Test", 
                    True, 
                    f"Successfully retrieved profile for {data.get('email')}"
                )
                return True
                
            else:
                self.log_test(
                    "Profile Endpoint Test", 
                    False, 
                    f"HTTP {response.status_code}", 
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Profile Endpoint Test", False, f"Request error: {str(e)}")
            return False
    
    def test_profile_endpoint_without_token(self):
        """Test GET /api/auth/profile without token"""
        try:
            response = self.session.get(f"{self.base_url}/auth/profile")
            
            if response.status_code == 403:
                self.log_test(
                    "Profile Endpoint - No Token", 
                    True, 
                    "Correctly rejected request without token with 403"
                )
                return True
            else:
                self.log_test(
                    "Profile Endpoint - No Token", 
                    False, 
                    f"Expected 403, got HTTP {response.status_code}", 
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Profile Endpoint - No Token", False, f"Request error: {str(e)}")
            return False
    
    def test_profile_endpoint_invalid_token(self):
        """Test GET /api/auth/profile with invalid token"""
        try:
            headers = {
                "Authorization": "Bearer invalid_token_here",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{self.base_url}/auth/profile", headers=headers)
            
            if response.status_code == 401:
                self.log_test(
                    "Profile Endpoint - Invalid Token", 
                    True, 
                    "Correctly rejected invalid token with 401"
                )
                return True
            else:
                self.log_test(
                    "Profile Endpoint - Invalid Token", 
                    False, 
                    f"Expected 401, got HTTP {response.status_code}", 
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Profile Endpoint - Invalid Token", False, f"Request error: {str(e)}")
            return False
    
    def test_jwt_token_structure(self):
        """Test JWT token structure and content"""
        if not self.admin_token:
            self.log_test("JWT Token Structure Test", False, "No admin token available")
            return False
        
        try:
            import base64
            import json
            
            # Split JWT token
            parts = self.admin_token.split('.')
            if len(parts) != 3:
                self.log_test(
                    "JWT Token Structure Test", 
                    False, 
                    f"JWT should have 3 parts, got {len(parts)}"
                )
                return False
            
            # Decode payload (add padding if needed)
            payload_part = parts[1]
            # Add padding if needed
            payload_part += '=' * (4 - len(payload_part) % 4)
            
            try:
                payload_bytes = base64.urlsafe_b64decode(payload_part)
                payload = json.loads(payload_bytes.decode('utf-8'))
                
                # Check required fields
                required_fields = ["sub", "email", "role", "exp"]
                missing_fields = [field for field in required_fields if field not in payload]
                
                if missing_fields:
                    self.log_test(
                        "JWT Token Structure Test", 
                        False, 
                        f"Missing JWT payload fields: {missing_fields}", 
                        payload
                    )
                    return False
                
                # Verify payload content
                if payload.get("email") != "admin@musitech.com":
                    self.log_test(
                        "JWT Token Structure Test", 
                        False, 
                        f"JWT email mismatch: expected admin@musitech.com, got {payload.get('email')}", 
                        payload
                    )
                    return False
                
                if payload.get("role") != "admin":
                    self.log_test(
                        "JWT Token Structure Test", 
                        False, 
                        f"JWT role mismatch: expected admin, got {payload.get('role')}", 
                        payload
                    )
                    return False
                
                self.log_test(
                    "JWT Token Structure Test", 
                    True, 
                    f"JWT token valid with user_id: {payload.get('sub')}, email: {payload.get('email')}, role: {payload.get('role')}"
                )
                return True
                
            except Exception as decode_error:
                self.log_test(
                    "JWT Token Structure Test", 
                    False, 
                    f"Failed to decode JWT payload: {str(decode_error)}"
                )
                return False
                
        except Exception as e:
            self.log_test("JWT Token Structure Test", False, f"JWT analysis error: {str(e)}")
            return False
    
    def test_database_admin_user(self):
        """Test that admin user exists in database by trying to create it again"""
        try:
            response = self.session.post(f"{self.base_url}/auth/create-admin")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("email") == "admin@musitech.com" and data.get("role") == "admin":
                    self.log_test(
                        "Database Admin User Test", 
                        True, 
                        "Admin user exists in database with correct email and role"
                    )
                    return True
                else:
                    self.log_test(
                        "Database Admin User Test", 
                        False, 
                        f"Admin user data incorrect: email={data.get('email')}, role={data.get('role')}", 
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Database Admin User Test", 
                    False, 
                    f"HTTP {response.status_code}", 
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Database Admin User Test", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("=" * 60)
        print("BACKEND AUTHENTICATION SYSTEM TEST SUITE")
        print("=" * 60)
        print(f"Testing backend at: {self.base_url}")
        print()
        
        tests = [
            self.test_basic_connectivity,
            self.test_database_admin_user,
            self.test_admin_login,
            self.test_invalid_credentials,
            self.test_profile_endpoint_with_token,
            self.test_profile_endpoint_without_token,
            self.test_profile_endpoint_invalid_token,
            self.test_jwt_token_structure,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Passed: {passed}/{total}")
        print(f"Failed: {total - passed}/{total}")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Authentication system is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        print()
        print("DETAILED CURL COMMANDS FOR MANUAL TESTING:")
        print("=" * 60)
        
        print("1. Test basic connectivity:")
        print(f"curl -X GET '{self.base_url}/'")
        print()
        
        print("2. Login with admin credentials:")
        print(f"curl -X POST '{self.base_url}/auth/login' \\")
        print("  -H 'Content-Type: application/json' \\")
        print("  -d '{\"email\": \"admin@musitech.com\", \"password\": \"admin\"}'")
        print()
        
        print("3. Get profile (replace TOKEN with actual token from login):")
        print(f"curl -X GET '{self.base_url}/auth/profile' \\")
        print("  -H 'Authorization: Bearer TOKEN'")
        print()
        
        print("4. Test invalid credentials:")
        print(f"curl -X POST '{self.base_url}/auth/login' \\")
        print("  -H 'Content-Type: application/json' \\")
        print("  -d '{\"email\": \"admin@musitech.com\", \"password\": \"wrong\"}'")
        print()
        
        return passed == total

if __name__ == "__main__":
    tester = AuthenticationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)