#!/usr/bin/env python3
"""
Server Stress Test - Identify Root Cause of 3-Photo Failures
Tests different scenarios to pinpoint the exact failure conditions
"""

import requests
import json
import time
import os
import random
import base64
import threading
from PIL import Image
import io
from datetime import datetime

# Configuration
SERVER_URL = "https://fuell.onrender.com/api"
PHOTOS_FOLDER = "photosamples"
API_KEY = os.environ.get('ANTHROPIC_API_KEY')

def get_photo_files():
    """Get list of photo files"""
    if not os.path.exists(PHOTOS_FOLDER):
        raise FileNotFoundError(f"No photos found in {PHOTOS_FOLDER} folder!")
    
    photo_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.heic', '*.HEIC']:
        import glob
        photo_files.extend(glob.glob(os.path.join(PHOTOS_FOLDER, ext)))
    
    if not photo_files:
        raise FileNotFoundError(f"No photos found in {PHOTOS_FOLDER} folder!")
    
    return photo_files

def compress_image_like_app(image_path, max_width=1600, quality=0.7):
    """Compress image like the app does"""
    try:
        # Handle HEIC files
        if image_path.lower().endswith('.heic'):
            print(f"    ⚠️  HEIC file - converting to JPEG")
            # Use sips command (macOS) to convert HEIC to JPEG
            import subprocess
            temp_path = image_path.replace('.HEIC', '_temp.jpg').replace('.heic', '_temp.jpg')
            subprocess.run(['sips', '-s', 'format', 'jpeg', image_path, '--out', temp_path], 
                          check=True, capture_output=True)
            image_path = temp_path
        
        # Open and process image
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Compress
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=int(quality * 100), optimize=True)
            compressed_data = output.getvalue()
            
            # If still too large, compress more
            if len(compressed_data) > 5 * 1024 * 1024:  # 5MB
                print(f"    📏 Still too large, compressing more...")
                img = img.resize((1200, int(1200 * img.height / img.width)), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=int(0.6 * 100), optimize=True)
                compressed_data = output.getvalue()
            
            # Clean up temp file if created
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            
            return base64.b64encode(compressed_data).decode('utf-8')
            
    except Exception as e:
        print(f"    ❌ Compression failed: {e}")
        return None

def get_app_prompt():
    """Get the exact prompt used by the app"""
    return """You are a nutrition expert. Analyze this food image and provide:

1. **Food Items**: List each food item you can identify
2. **Portions**: Estimate serving sizes (cups, pieces, etc.)
3. **Macros**: For each food item, provide:
   - Calories
   - Protein (g)
   - Carbs (g) 
   - Fat (g)
4. **Total**: Sum up all macros for the complete meal

Be specific with portions and accurate with macro estimates. If you're unsure about a food item, make your best estimate and note any uncertainty.

Format your response as JSON with this structure:
{
  "food_items": [
    {
      "name": "food name",
      "portion": "1 cup",
      "calories": 150,
      "protein": 5,
      "carbs": 30,
      "fat": 2
    }
  ],
  "total": {
    "calories": 150,
    "protein": 5,
    "carbs": 30,
    "fat": 2
  }
}"""

def test_server_request(photo_paths, test_name, delay_between_images=0.5, delay_before_request=2.0):
    """Test server request with specific parameters"""
    photo_names = [os.path.basename(p) for p in photo_paths]
    print(f"  🧪 {test_name}: {', '.join(photo_names)}")
    
    start_time = time.time()
    
    try:
        # Process images with delays
        compressed_images = []
        for i, photo_path in enumerate(photo_paths):
            print(f"    📸 Processing image {i+1}/{len(photo_paths)}...")
            compressed_image = compress_image_like_app(photo_path)
            if compressed_image:
                compressed_images.append(compressed_image)
                print(f"    📏 Compressed: {len(compressed_image)/1024:.1f}KB")
            else:
                print(f"    ❌ Failed to compress {photo_path}")
                return None
            
            # Delay between images
            if i < len(photo_paths) - 1:
                time.sleep(delay_between_images)
        
        # Create content
        content = [{'type': 'text', 'text': get_app_prompt()}]
        for compressed_image in compressed_images:
            content.append({
                'type': 'image',
                'source': {
                    'type': 'base64',
                    'media_type': 'image/jpeg',
                    'data': compressed_image
                }
            })
        
        # Create payload
        payload = {
            'model': 'claude-sonnet-4-5-20250929',
            'max_tokens': 200,
            'messages': [{
                'role': 'user',
                'content': content
            }]
        }
        
        # Delay before request
        if delay_before_request > 0:
            print(f"    ⏳ Adding {delay_before_request}s delay before request...")
            time.sleep(delay_before_request)
        
        print(f"    🌐 Sending request...")
        print(f"    📊 Payload size: {len(json.dumps(payload))/1024:.1f}KB")
        
        # Send request
        response = requests.post(f"{SERVER_URL}/analyze",
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=120
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            print(f"    ✅ Success: {duration:.2f}s")
            return {
                'success': True,
                'duration': duration,
                'test_name': test_name,
                'photos': photo_names,
                'payload_size_kb': len(json.dumps(payload))/1024
            }
        else:
            print(f"    ❌ Failed: HTTP {response.status_code}")
            print(f"    📄 Response: {response.text[:200]}...")
            return {
                'success': False,
                'duration': duration,
                'test_name': test_name,
                'photos': photo_names,
                'error': f"HTTP {response.status_code}",
                'payload_size_kb': len(json.dumps(payload))/1024
            }
            
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        print(f"    ❌ Exception: {e}")
        return {
            'success': False,
            'duration': duration,
            'test_name': test_name,
            'photos': photo_names,
            'error': str(e)
        }

def run_stress_tests():
    """Run comprehensive stress tests"""
    print("🔬 Server Stress Test - Root Cause Analysis")
    print("="*60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not API_KEY:
        print("❌ ANTHROPIC_API_KEY not found!")
        print("💡 Run with: ANTHROPIC_API_KEY='your_key' python3 test_server_stress.py")
        return
    
    # Get photos
    photos = get_photo_files()
    print(f"📸 Found {len(photos)} photos")
    
    all_results = []
    
    # PHASE 1: Baseline - Single 3-photo request
    print(f"\n📸 PHASE 1: Baseline Test (Single 3-Photo Request)")
    print("="*60)
    baseline_photos = random.sample(photos, 3)
    baseline_result = test_server_request(baseline_photos, "Baseline", delay_between_images=0.5, delay_before_request=2.0)
    all_results.append(baseline_result)
    
    # PHASE 2: Sequential requests (5 tests)
    print(f"\n📸 PHASE 2: Sequential Requests (5 tests)")
    print("="*60)
    for i in range(5):
        selected_photos = random.sample(photos, 3)
        result = test_server_request(selected_photos, f"Sequential-{i+1}", delay_between_images=0.5, delay_before_request=2.0)
        all_results.append(result)
        time.sleep(1)  # 1 second between tests
    
    # PHASE 3: Rapid requests (stress test)
    print(f"\n📸 PHASE 3: Rapid Requests (Stress Test)")
    print("="*60)
    for i in range(3):
        selected_photos = random.sample(photos, 3)
        result = test_server_request(selected_photos, f"Rapid-{i+1}", delay_between_images=0.2, delay_before_request=0.5)
        all_results.append(result)
        time.sleep(0.5)  # Only 0.5 seconds between tests
    
    # PHASE 4: Concurrent requests (simulate multiple users)
    print(f"\n📸 PHASE 4: Concurrent Requests (3 simultaneous)")
    print("="*60)
    concurrent_results = []
    
    def concurrent_test(photos, test_name):
        result = test_server_request(photos, test_name, delay_between_images=0.5, delay_before_request=2.0)
        concurrent_results.append(result)
    
    # Start 3 concurrent requests
    threads = []
    for i in range(3):
        selected_photos = random.sample(photos, 3)
        thread = threading.Thread(target=concurrent_test, args=(selected_photos, f"Concurrent-{i+1}"))
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    all_results.extend(concurrent_results)
    
    # PHASE 5: Large payload test
    print(f"\n📸 PHASE 5: Large Payload Test (3 largest photos)")
    print("="*60)
    # Sort photos by size and take the 3 largest
    photo_sizes = []
    for photo in photos:
        try:
            size = os.path.getsize(photo)
            photo_sizes.append((photo, size))
        except:
            pass
    
    photo_sizes.sort(key=lambda x: x[1], reverse=True)
    largest_photos = [photo for photo, size in photo_sizes[:3]]
    large_result = test_server_request(largest_photos, "Large-Payload", delay_between_images=0.5, delay_before_request=2.0)
    all_results.append(large_result)
    
    # PHASE 6: No delays test (maximum stress)
    print(f"\n📸 PHASE 6: No Delays Test (Maximum Stress)")
    print("="*60)
    for i in range(2):
        selected_photos = random.sample(photos, 3)
        result = test_server_request(selected_photos, f"NoDelays-{i+1}", delay_between_images=0, delay_before_request=0)
        all_results.append(result)
        time.sleep(0.2)  # Minimal delay
    
    # Generate comprehensive report
    print(f"\n📊 STRESS TEST RESULTS")
    print("="*60)
    
    successful_tests = [r for r in all_results if r and r.get('success')]
    failed_tests = [r for r in all_results if r and not r.get('success')]
    
    print(f"Total Tests: {len(all_results)}")
    print(f"Successful: {len(successful_tests)} ({len(successful_tests)/len(all_results)*100:.1f}%)")
    print(f"Failed: {len(failed_tests)} ({len(failed_tests)/len(all_results)*100:.1f}%)")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for test in failed_tests:
            print(f"  - {test['test_name']}: {test.get('error', 'Unknown error')}")
    
    # Analyze patterns
    print(f"\n🔍 PATTERN ANALYSIS:")
    
    # By test type
    test_types = {}
    for result in all_results:
        if result:
            test_type = result['test_name'].split('-')[0]
            if test_type not in test_types:
                test_types[test_type] = {'success': 0, 'total': 0}
            test_types[test_type]['total'] += 1
            if result['success']:
                test_types[test_type]['success'] += 1
    
    for test_type, stats in test_types.items():
        success_rate = stats['success'] / stats['total'] * 100
        print(f"  {test_type}: {success_rate:.1f}% success rate ({stats['success']}/{stats['total']})")
    
    # By payload size
    if successful_tests:
        avg_payload_size = sum(r.get('payload_size_kb', 0) for r in successful_tests) / len(successful_tests)
        print(f"  Average successful payload size: {avg_payload_size:.1f}KB")
    
    if failed_tests:
        avg_failed_payload_size = sum(r.get('payload_size_kb', 0) for r in failed_tests) / len(failed_tests)
        print(f"  Average failed payload size: {avg_failed_payload_size:.1f}KB")
    
    print(f"\n⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    print("✅ Stress test completed!")

if __name__ == "__main__":
    run_stress_tests()
