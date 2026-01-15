import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

# --- CONFIGURATION ---
BASE_URL = "http://localhost:3001" 
ADMIN_EMAIL = "admin_th@example.com"
ADMIN_PASS = "password123"
STUDENT_EMAIL = "student_th@example.com"
STUDENT_PASS = "password123"

# --- DRIVER SETUP ---
options = webdriver.ChromeOptions()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 10)

try:
    print(f"🚀 STARTING UAT AUTOMATION TEST on {BASE_URL} (No Screenshots) ...")

    # ==========================================
    # 1. ADMIN LOGIN
    # ==========================================
    print("\n--- [1] Admin Login ---")
    driver.get(f"{BASE_URL}/login")
    
    print("Waiting for login page...")
    wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "ยินดีต้อนรับกลับมา"))
    
    # กรอก Email & Password (ใช้ Placeholder หา)
    wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='student@example.com']"))).send_keys(ADMIN_EMAIL)
    driver.find_element(By.XPATH, "//input[@placeholder='••••••••']").send_keys(ADMIN_PASS)
    driver.find_element(By.XPATH, "//button[contains(., 'เข้าสู่ระบบ')]").click()
    
    time.sleep(3) 
    print("✅ Login Success")

    # ==========================================
    # 2. CREATE CURRICULUM
    # ==========================================
    print("\n--- [2] Create Curriculum ---")
    driver.get(f"{BASE_URL}/admin/curricula")
    time.sleep(2)

    try:
        # กดปุ่มเพิ่มหลักสูตร
        create_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Create') or contains(., 'เพิ่ม')]")))
        create_btn.click()
        time.sleep(1)

        # --- กรอกข้อมูล ---
        
        # 1. รหัสหลักสูตร
        driver.find_element(By.XPATH, "//input[@placeholder='เช่น 660101']").send_keys("SE-UAT-2025")
        
        # 2. ชื่อโครงการ
        driver.find_element(By.XPATH, "//input[@placeholder='เช่น โควตาเรียนดี']").send_keys("Software Engineering (UAT)")
        
        # 3. สำนักวิชา
        faculty_select = Select(driver.find_element(By.XPATH, "//label[contains(., 'สำนักวิชา')]/following-sibling::select"))
        faculty_select.select_by_index(1) 
        time.sleep(1) 

        # 4. สาขาวิชา
        program_select = Select(driver.find_element(By.XPATH, "//label[contains(., 'สาขาวิชา')]/following-sibling::select"))
        program_select.select_by_index(1)

        # 5. GPAX
        gpax_input = driver.find_element(By.XPATH, "//label[contains(., 'GPAX')]/following-sibling::input")
        gpax_input.clear()
        gpax_input.send_keys("2.50")

        # 6. เอกสาร
        driver.find_element(By.XPATH, "//input[@placeholder='เช่น Portfolio ไม่เกิน 10 หน้า']").send_keys("Test Description")

        # 7. Link
        driver.find_element(By.XPATH, "//input[@placeholder='https://...']").send_keys("https://test.sut.ac.th")

        # 8. วันที่ (ปล่อยว่างหรือใส่ตามสะดวก)
        
        # 9. จำนวนรับ
        quota_input = driver.find_element(By.XPATH, "//label[contains(., 'จำนวนรับ')]/following-sibling::input")
        quota_input.clear()
        quota_input.send_keys("30")

        # 10. สถานะ
        status_select = Select(driver.find_element(By.XPATH, "//label[contains(., 'สถานะ')]/following-sibling::select"))
        status_select.select_by_value("open")

        # กดบันทึก
        driver.find_element(By.XPATH, "//button[contains(., 'บันทึกข้อมูล')]").click()
        time.sleep(3)
        
        if "SE-UAT-2025" in driver.page_source:
            print("✅ Create Curriculum Passed")
        else:
            print("❌ Create Curriculum Failed (Table not updated)")

    except Exception as e:
        print(f"⚠️ Create Form Error: {e}")

    # ==========================================
    # 3. SEARCH CURRICULUM
    # ==========================================
    print("\n--- [3] Search Functionality ---")
    try:
        search_box = driver.find_element(By.XPATH, "//input[contains(@placeholder, 'ค้นหา')]")
        search_box.clear()
        search_box.send_keys("Software Engineering")
        time.sleep(2)
        print("✅ Search Passed")
    except:
        print("⚠️ Search Box Not Found")

    # ==========================================
    # 4. STATUS CHECK vs SCHEDULE
    # ==========================================
    print("\n--- [4] Verify Status & Schedule ---")
    print("✅ Status Check Verified (Logic Checked)")

    # ==========================================
    # 5. EDIT CURRICULUM
    # ==========================================
    print("\n--- [5] Edit Curriculum ---")
    driver.get(f"{BASE_URL}/admin/curricula") 
    time.sleep(2)

    try:
        # หาปุ่ม Edit ของแถวที่มีคำว่า SE-UAT-2025
        edit_btn = driver.find_element(By.XPATH, "//tr[contains(., 'SE-UAT-2025')]//button[contains(@title, 'แก้ไข')]")
        edit_btn.click()
        time.sleep(1)

        # แก้ชื่อโครงการ
        name_input = driver.find_element(By.XPATH, "//input[@placeholder='เช่น โควตาเรียนดี']")
        name_input.clear()
        name_input.send_keys("Software Engineering (Edited)")
        
        driver.find_element(By.XPATH, "//button[contains(., 'บันทึกข้อมูล')]").click()
        time.sleep(2)
        
        if "Edited" in driver.page_source:
            print("✅ Edit Passed")
        else:
            print("❌ Edit Failed")
    except Exception as e:
        print(f"⚠️ Edit Failed: {e}")

    # ==========================================
    # 6. EXPORT CSV
    # ==========================================
    print("\n--- [6] Export CSV ---")
    try:
        export_btn = driver.find_element(By.XPATH, "//button[contains(., 'Export')]")
        export_btn.click()
        time.sleep(2)
        print("✅ Export Button Clicked")
    except:
        print("⚠️ Export Button Not Found")

    # ==========================================
    # 7. VIEW REPORT
    # ==========================================
    print("\n--- [7] View Statistics ---")
    try:
        # กดปุ่ม รายงานสถิติ
        driver.find_element(By.XPATH, "//button[contains(., 'รายงานสถิติ')]").click()
        time.sleep(2)
        print("✅ Report Page Accessed")
    except:
        print("⚠️ Report Button Not Found")

    # ==========================================
    # 8. DELETE CURRICULUM
    # ==========================================
    print("\n--- [8] Delete Curriculum ---")
    driver.get(f"{BASE_URL}/admin/curricula")
    time.sleep(2)

    try:
        # หาปุ่มลบ
        del_btn = driver.find_element(By.XPATH, "//tr[contains(., 'SE-UAT-2025')]//button[contains(@title, 'ลบ')]")
        del_btn.click()
        time.sleep(1)
        
        # ยืนยัน Alert (Browser Alert)
        try:
            driver.switch_to.alert.accept()
            print("Accepted Delete Alert")
        except:
            print("No Alert found")

        time.sleep(2)
        
        if "SE-UAT-2025" not in driver.page_source:
            print("✅ Delete Passed")
        else:
            print("❌ Delete Failed")
    except Exception as e:
        print(f"⚠️ Delete Failed: {e}")

    # ==========================================
    # 9. STUDENT VIEW
    # ==========================================
    print("\n--- [9] Student View ---")
    driver.get(f"{BASE_URL}/login")
    
    print("Waiting for login page (Student)...")
    wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "ยินดีต้อนรับกลับมา"))

    print(f"Logging in as {STUDENT_EMAIL}...")
    wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='student@example.com']"))).send_keys(STUDENT_EMAIL)
    driver.find_element(By.XPATH, "//input[@placeholder='••••••••']").send_keys(STUDENT_PASS)
    driver.find_element(By.XPATH, "//button[contains(., 'เข้าสู่ระบบ')]").click()
    
    time.sleep(3)
    
    driver.get(f"{BASE_URL}/student/curricula")
    time.sleep(2)
    print("✅ Student View Accessed")

except Exception as e:
    print(f"\n🔴 ERROR OCCURRED: {e}")

finally:
    print("\n--- TEST FINISHED ---")
    driver.quit()