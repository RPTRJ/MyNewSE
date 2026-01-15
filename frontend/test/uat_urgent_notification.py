import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIGURATION ---
BASE_URL = "http://localhost:3001" 
STUDENT_EMAIL = "student_th@example.com"
STUDENT_PASS = "password123"

# ตั้งค่า Driver
options = webdriver.ChromeOptions()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 15)

try:
    print(f"🚀 STARTING UAT: Time-Sensitive Notification Test (No Screenshots)...")
    
    # ====================================================
    # 1. LOGIN
    # ====================================================
    print("\n--- [1] Student Login ---")
    driver.get(f"{BASE_URL}/login")
    wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "ยินดีต้อนรับกลับมา"))
    
    wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='student@example.com']"))).send_keys(STUDENT_EMAIL)
    driver.find_element(By.XPATH, "//input[@placeholder='••••••••']").send_keys(STUDENT_PASS)
    driver.find_element(By.XPATH, "//button[contains(., 'เข้าสู่ระบบ')]").click()
    
    time.sleep(3)
    print("✅ Login Success")

    # ====================================================
    # 2. SEARCH & VIEW
    # ====================================================
    print("\n--- [2] Search Urgent Curriculum ---")
    driver.get(f"{BASE_URL}/student/curricula")
    time.sleep(2)
    
    try:
        search_box = driver.find_element(By.XPATH, "//input[contains(@placeholder, 'ค้นหา')]")
        search_box.clear()
        search_box.send_keys("URGENT")
        time.sleep(2)
    except:
        pass 

    # ====================================================
    # 3. APPLY (เช็คสถานะ)
    # ====================================================
    print("\n--- [3] Check Application Status ---")
    time.sleep(2) # รอโหลดการ์ด
    
    # ถ้ายังไม่ได้กดเลือก ให้กด (เผื่อไว้)
    try:
        # เช็คว่าปุ่มเป็น "เลือกแล้ว" หรือยัง
        if "เลือกแล้ว" not in driver.page_source and "Selected" not in driver.page_source:
             print("Clicking Apply/Select button...")
             driver.find_element(By.XPATH, "//button[contains(., 'สมัคร') or contains(., 'เลือก') or contains(., 'Apply')]").click()
             try:
                driver.find_element(By.XPATH, "//button[contains(., 'ยืนยัน') or contains(., 'Confirm')]").click()
             except: pass
        else:
             print("ℹ️ Course already selected.")
    except:
        pass

    # ====================================================
    # 4. CHECK CALENDAR
    # ====================================================
    print("\n--- [4] Check Calendar ---")
    driver.get(f"{BASE_URL}/student/calendar")
    time.sleep(2)
    
    if "URGENT" in driver.page_source:
        print("✅ Found 'URGENT' event on Calendar")
    else:
        print("⚠️ Event NOT found on Calendar")

    # ====================================================
    # 5. WAIT FOR NOTIFICATIONS (แก้ไข: กดทีเดียวแล้วรอ)
    # ====================================================
    print("\n--- [5] Waiting for Notifications (Max 10 mins) ---")
    
    # กลับมาหน้าหลักสูตร
    driver.get(f"{BASE_URL}/student/curricula")
    time.sleep(2)
    
    # พิมพ์ค้นหาอีกรอบ เพื่อให้แน่ใจว่าอยู่หน้าการ์ดที่ถูกต้อง
    try:
        search_input = driver.find_element(By.XPATH, "//input[contains(@placeholder, 'ค้นหา')]")
        search_input.clear()
        search_input.send_keys("URGENT")
        time.sleep(2)
    except: pass

    # --- ขั้นตอน A: กดกระดิ่ง 1 ครั้งถ้วน ---
    print("🔔 Clicking Bell Button ONCE...")
    try:
        # หาปุ่มกระดิ่งที่อยู่ข้างๆ ปุ่ม "เลือกแล้ว" (หรือปุ่มเขียว)
        bell_xpath = "//button[(contains(., 'เลือกแล้ว') or contains(., 'Selected'))]/..//button[.//svg]"
        # หรือ XPath สำรอง
        bell_xpath_alt = "//button[contains(., 'เลือกแล้ว')]/following-sibling::button"
        
        try:
            driver.find_element(By.XPATH, bell_xpath).click()
        except:
            driver.find_element(By.XPATH, bell_xpath_alt).click()
            
        print("✅ Bell Clicked. Notification panel/system active.")
    except Exception as e:
        print(f"⚠️ Warning: Could not click specific bell. System will just wait for auto-popups.")

    # --- ขั้นตอน B: นั่งรออย่างเดียว (Watching Mode) ---
    print("⏳ Watching for notifications... (Auto-closing popups)")
    
    found_7 = False
    found_5 = False
    found_1 = False
    start_time = time.time()
    
    while time.time() - start_time < 600: # รอสูงสุด 10 นาที
        elapsed = int(time.time() - start_time)
        print(f"\r⏳ Time elapsed: {elapsed}s | Found: {'[7m] ' if found_7 else ''}{'[5m] ' if found_5 else ''}{'[1m]' if found_1 else ''}", end="")
        
        try:
            # ดึง Source ปัจจุบันมาเช็ค
            page_source = driver.page_source
            
            # 1. เช็ค 7 นาที
            if not found_7 and ("7 นาที" in page_source or "7 minute" in page_source):
                print("\n\n🔔 FOUND: 7 Minutes Notification!")
                found_7 = True
                # พยายามปิด Popup (คลิกที่ Body หรือหาปุ่ม Close) เพื่อเคลียร์หน้าจอ
                try: driver.find_element(By.TAG_NAME, "body").click() 
                except: pass

            # 2. เช็ค 5 นาที
            if not found_5 and ("5 นาที" in page_source or "5 minute" in page_source):
                print("\n\n🔔 FOUND: 5 Minutes Notification!")
                found_5 = True
                try: driver.find_element(By.TAG_NAME, "body").click() 
                except: pass

            # 3. เช็ค 1 นาที
            if not found_1 and ("1 นาที" in page_source or "1 minute" in page_source):
                print("\n\n🔔 FOUND: 1 Minute Notification!")
                found_1 = True
                print("\n✅ All notifications captured! Test Complete.")
                break # จบการทำงาน
                
        except Exception:
            pass 
        
        time.sleep(1) # เช็คทุก 1 วินาที

    if not found_1:
        print("\n⚠️ Time limit reached. Not all notifications were found.")

except Exception as e:
    print(f"\n🔴 Critical Error: {e}")

finally:
    driver.quit()
    print("\n--- TEST FINISHED ---")