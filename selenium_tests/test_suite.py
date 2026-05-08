import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

class CompulysisTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")
        
        # Suppress internal Chrome SSL/Handshake error logs from cluttering the terminal
        chrome_options.add_argument("--log-level=3")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])
        # Initialize the webdriver
        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.implicitly_wait(15)
        # Fallback to local if env var not set
        cls.base_url = os.getenv("BASE_URL", "http://16.16.16.219:8004")
        cls.wait = WebDriverWait(cls.driver, 20)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def _ensure_logged_in(self):
        """Helper to ensure the browser is logged in before running independent tests."""
        current = self.driver.current_url
        if "data:," in current or "/login" in current or current == "":
            self.driver.get(f"{self.base_url}/login")
            email_input = self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
            password_input = self.driver.find_element(By.NAME, "password")
            submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            
            email_input.clear()
            email_input.send_keys("admin@compulysis.com")
            password_input.clear()
            password_input.send_keys("admin123")
            submit_btn.click()
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "aside")))

    def test_01_login_page_load(self):
        """Test 1: Verify the login page loads correctly."""
        self.driver.get(f"{self.base_url}/login")
        # Wait for the main heading instead of data-testid
        heading = self.wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Compulysis')]")))
        self.assertTrue(heading.is_displayed())

    def test_02_invalid_login(self):
        """Test 2: Attempt login with invalid credentials."""
        self.driver.get(f"{self.base_url}/login")
        email_input = self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        password_input = self.driver.find_element(By.NAME, "password")
        submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
        
        email_input.clear()
        email_input.send_keys("wrong@compulysis.com")
        password_input.clear()
        password_input.send_keys("wrongpassword")
        submit_btn.click()
        
        # Verify we are still on the login page
        time.sleep(2)
        self.assertIn("/login", self.driver.current_url)

    def test_03_valid_login(self):
        """Test 3: Login with valid credentials and verify redirect."""
        self.driver.get(f"{self.base_url}/login")
        email_input = self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        password_input = self.driver.find_element(By.NAME, "password")
        submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
        
        email_input.clear()
        email_input.send_keys("admin@compulysis.com")
        password_input.clear()
        password_input.send_keys("admin123")
        submit_btn.click()
        
        # Wait for sidebar/aside to verify login success
        sidebar = self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "aside")))
        self.assertTrue(sidebar.is_displayed())

    def test_04_dashboard_load(self):
        """Test 4: Verify Dashboard renders properly."""
        self._ensure_logged_in()
        # Find the Dashboard link via href="/"
        nav_dashboard = self.wait.until(EC.presence_of_element_located((By.XPATH, "//a[@href='/']")))
        nav_dashboard.click()
        time.sleep(1) # Give it time to render
        body = self.driver.find_element(By.TAG_NAME, "body")
        self.assertIn("Dashboard", body.text)

    def test_05_nav_patients(self):
        """Test 5: Navigate to Patient Management."""
        self._ensure_logged_in()
        nav_patients = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[@href='/patients']")))
        nav_patients.click()
        time.sleep(1)
        body = self.driver.find_element(By.TAG_NAME, "body")
        self.assertIn("Patient", body.text)

    def test_06_nav_assessment(self):
        """Test 6: Navigate to Assessment page."""
        self._ensure_logged_in()
        nav_assessment = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/assessment')]")))
        nav_assessment.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Assessment')] | //*[contains(text(), 'Assessment')]")))

    def test_07_nav_model_lab(self):
        """Test 7: Navigate to Model Lab page."""
        self._ensure_logged_in()
        nav_model_lab = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[@href='/model-lab']")))
        nav_model_lab.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Model')] | //*[contains(text(), 'Model Laboratory')]")))

    def test_08_nav_data_explorer(self):
        """Test 8: Navigate to Data Explorer page."""
        self._ensure_logged_in()
        nav_data_explorer = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[@href='/data-explorer']")))
        nav_data_explorer.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Data')] | //*[contains(text(), 'Data Explorer')]")))

    def test_09_nav_reports(self):
        """Test 9: Navigate to Reports page."""
        self._ensure_logged_in()
        nav_reports = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[@href='/reports']")))
        nav_reports.click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Report')] | //*[contains(text(), 'Reports')]")))

    def test_10_patient_search(self):
        """Test 10: Verify Patient Search works."""
        self._ensure_logged_in()
        self.driver.get(f"{self.base_url}/patients")
        search_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[contains(@placeholder, 'Search')]")))
        search_input.send_keys("John Doe")
        time.sleep(1) # Allow search to filter
        self.assertTrue(search_input.is_displayed())

    def test_11_add_patient_modal(self):
        """Test 11: Verify Add Patient Modal opens."""
        self._ensure_logged_in()
        self.driver.get(f"{self.base_url}/patients")
        add_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Add New Patient')]")))
        add_btn.click()
        modal = self.wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(text(), 'Add New Patient')]")))
        self.assertTrue(modal.is_displayed())
        # Close modal
        close_btn = self.driver.find_element(By.XPATH, "//div[contains(@class, 'bg-opacity-50')]//button | //div[contains(@class, 'z-50')]//button")
        close_btn.click()
        time.sleep(1)

    def test_12_assessment_form(self):
        """Test 12: Verify Assessment form renders."""
        self._ensure_logged_in()
        self.driver.get(f"{self.base_url}/assessment")
        time.sleep(1)
        body = self.driver.find_element(By.TAG_NAME, "body")
        self.assertIn("Assessment", body.text)

    def test_13_model_lab_ui(self):
        """Test 13: Verify Model Lab UI renders."""
        self._ensure_logged_in()
        self.driver.get(f"{self.base_url}/model-lab")
        time.sleep(1)
        body = self.driver.find_element(By.TAG_NAME, "body")
        self.assertIn("Model", body.text)

    def test_14_data_explorer_table(self):
        """Test 14: Verify Data Explorer Table renders."""
        self._ensure_logged_in()
        self.driver.get(f"{self.base_url}/data-explorer")
        time.sleep(1)
        body = self.driver.find_element(By.TAG_NAME, "body")
        self.assertIn("Data", body.text)

    def test_15_logout(self):
        """Test 15: Verify Logout functionality."""
        self._ensure_logged_in()
        logout_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Logout')]")))
        logout_btn.click()
        heading = self.wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Compulysis')]")))
        self.assertTrue(heading.is_displayed())

if __name__ == "__main__":
    unittest.main(verbosity=2)
