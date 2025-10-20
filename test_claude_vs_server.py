#!/usr/bin/env python3
"""
Claude vs Server Comparison Test
Tests 3-picture scenarios to identify if failures are from Claude API or server issues
"""

import requests
import os
import time
import json
import base64
import random
import glob
from datetime import datetime
from PIL import Image
import io
import subprocess

# Test configurations
API_KEY = os.environ.get('ANTHROPIC_API_KEY')
SERVER_URL = 'https://fuell.onrender.com/api'
CLAUDE_URL = 'https://api.anthropic.com/v1/messages'
PHOTOS_FOLDER = 'photosamples'
RESULTS_FOLDER = 'comparison_results'

# Test parameters - only 3 pictures
TEST_ITERATIONS = {
    '3_pictures': 5  # 5 tests of 3 pictures each
}

def ensure_results_folder():
    """Create results folder if it doesn't exist"""
    os.makedirs(RESULTS_FOLDER, exist_ok=True)

def get_photo_files():
    """Get all photo files from photosamples folder"""
    photo_extensions = ['*.jpg', '*.jpeg', '*.png', '*.heic', '*.HEIC', '*.JPG', '*.JPEG', '*.PNG']
    photos = []
    
    for ext in photo_extensions:
        photos.extend(glob.glob(os.path.join(PHOTOS_FOLDER, ext)))
    
    if not photos:
        raise FileNotFoundError(f"No photos found in {PHOTOS_FOLDER} folder!")
    
    print(f"📸 Found {len(photos)} photos in {PHOTOS_FOLDER}")
    return photos

def compress_image_like_app(image_path, max_width=1600, quality=0.7):
    """Compress image using the same settings as the Fuel app"""
    try:
        # Check if it's a HEIC file
        if image_path.lower().endswith('.heic'):
            print(f"  ⚠️  HEIC file - converting to JPEG")
            try:
                # Try using sips (macOS built-in tool)
                temp_jpg = image_path.replace('.HEIC', '_temp.jpg').replace('.heic', '_temp.jpg')
                
                # Convert HEIC to JPEG using sips
                result = subprocess.run(['sips', '-s', 'format', 'jpeg', image_path, '--out', temp_jpg], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0 and os.path.exists(temp_jpg):
                    # Process the converted JPEG
                    with Image.open(temp_jpg) as img:
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        if img.width > max_width:
                            ratio = max_width / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        output = io.BytesIO()
                        img.save(output, format='JPEG', quality=int(quality * 100), optimize=True)
                        
                        size_mb = len(output.getvalue()) / (1024 * 1024)
                        print(f"  📏 Converted HEIC: {size_mb:.2f}MB")
                        
                        # Clean up temp file
                        os.remove(temp_jpg)
                        
                        return base64.b64encode(output.getvalue()).decode('utf-8')
                else:
                    print(f"  ❌ sips conversion failed")
                    raise Exception("sips conversion failed")
                    
            except Exception as e:
                print(f"  ❌ HEIC conversion failed: {e}")
                # Fallback: read raw file
                with open(image_path, 'rb') as f:
                    raw_data = f.read()
                    size_mb = len(raw_data) / (1024 * 1024)
                    print(f"  📏 Raw HEIC: {size_mb:.2f}MB")
                    return base64.b64encode(raw_data).decode('utf-8')
        
        # Handle regular images
        with Image.open(image_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=int(quality * 100), optimize=True)
            
            size_mb = len(output.getvalue()) / (1024 * 1024)
            print(f"  📏 Compressed: {size_mb:.2f}MB")
            
            return base64.b64encode(output.getvalue()).decode('utf-8')
            
    except Exception as e:
        print(f"  ❌ Compression failed: {e}")
        # Fallback: read original file
        with open(image_path, 'rb') as f:
            raw_data = f.read()
            size_mb = len(raw_data) / (1024 * 1024)
            print(f"  📏 Raw file: {size_mb:.2f}MB")
            return base64.b64encode(raw_data).decode('utf-8')

def get_app_prompt():
    """Get the exact prompt used in the Fuel app for multiple dishes"""
    return """**USER INDICATED: MULTIPLE ITEMS (sum for this meal)**

The user photographed MULTIPLE different food items that should be ADDED TOGETHER:

**Common scenarios:**
- Hot pot: multiple small plates
- Buffet: photo of each item taken
- Tapas or small plates dining
- Meal components photographed separately
- Multiple items in one sitting (e.g., coffee + pastry)

**How to analyze:**
1. Look at EACH image as a SEPARATE food item
2. Identify and estimate each item independently
3. For small plates, use visual cues to determine portion size (plate size, utensil references)
4. Calculate macros for EACH item separately
5. In your response, LIST OUT each item with its calorie estimate (transparency for user to verify)
6. Then ADD all macros together for the final total

**CRITICAL - Show your itemized breakdown in your response:**
In your conversational analysis, list each item like this:
- Item 1: [description] → ~[calories] cal
- Item 2: [description] → ~[calories] cal
- Item 3: [description] → ~[calories] cal
Total: [sum] calories

**Example response format:**
"Looking at your hot pot plates:
- Small plate of noodles (~80g) → 120 cal
- 6 thin beef slices (~60g) → 150 cal  
- Mixed vegetables (~100g) → 40 cal
Total: 310 calories."

**Full macro example for internal calculation:**
- Image 1 (Small plate of noodles): ~80g noodles = 120 cal, 4g protein, 24g carbs, 1g fat
- Image 2 (6 thin beef slices): ~60g beef = 150 cal, 18g protein, 0g carbs, 8g fat
- Image 3 (Vegetables): ~100g mixed veg = 40 cal, 2g protein, 8g carbs, 0g fat
- **TOTAL IN JSON: 310 cal, 24g protein, 32g carbs, 9g fat**"""

def test_direct_claude(photo_paths, iteration):
    """Test direct Claude API (bypass server)"""
    photo_names = [os.path.basename(p) for p in photo_paths]
    print(f"  🤖 Direct Claude Test {iteration}: {', '.join(photo_names)}")
    
    start_time = time.time()
    
    try:
        # Compress all images
        compressed_images = []
        for photo_path in photo_paths:
            compressed_images.append(compress_image_like_app(photo_path))
        
        # Create content with multiple images
        content = [
            {'type': 'text', 'text': get_app_prompt()}
        ]
        
        for compressed_image in compressed_images:
            content.append({
                'type': 'image',
                'source': {
                    'type': 'base64',
                    'media_type': 'image/jpeg',
                    'data': compressed_image
                }
            })
        
        # Send directly to Claude API
        response = requests.post(CLAUDE_URL,
            headers={
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'claude-sonnet-4-5-20250929',
                'max_tokens': 200,
                'messages': [{
                    'role': 'user',
                    'content': content
                }]
            },
            timeout=120
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            print(f"    ✅ Direct Claude Success: {duration:.2f}s")
            return {
                'success': True,
                'duration': duration,
                'photos': photo_names,
                'method': 'direct_claude',
                'response_size': len(response.text)
            }
        else:
            print(f"    ❌ Direct Claude Failed: HTTP {response.status_code}")
            return {
                'success': False,
                'duration': duration,
                'photos': photo_names,
                'method': 'direct_claude',
                'error': f"HTTP {response.status_code}"
            }
            
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        print(f"    ❌ Direct Claude Error: {e}")
        return {
            'success': False,
            'duration': duration,
            'photos': photo_names,
            'method': 'direct_claude',
            'error': str(e)
        }

def test_server_pipeline(photo_paths, iteration):
    """Test server pipeline (through your server) with optimizations"""
    photo_names = [os.path.basename(p) for p in photo_paths]
    print(f"  🌐 Server Pipeline Test {iteration}: {', '.join(photo_names)}")
    
    start_time = time.time()
    
    try:
        # OPTIMIZATION 1: Process images sequentially with delays
        compressed_images = []
        for i, photo_path in enumerate(photo_paths):
            print(f"    📸 Processing image {i+1}/{len(photo_paths)}...")
            # OPTIMIZATION 2: Reduce quality for 3+ photos
            if len(photo_paths) >= 3:
                compressed_images.append(compress_image_like_app(photo_path, max_width=1200, quality=0.5))
            else:
                compressed_images.append(compress_image_like_app(photo_path))
            # OPTIMIZATION 3: Add delay between image processing
            if i < len(photo_paths) - 1:  # Don't delay after last image
                time.sleep(0.5)  # 500ms delay between images
        
        # Create content with multiple images
        content = [
            {'type': 'text', 'text': get_app_prompt()}
        ]
        
        for compressed_image in compressed_images:
            content.append({
                'type': 'image',
                'source': {
                    'type': 'base64',
                    'media_type': 'image/jpeg',
                    'data': compressed_image
                }
            })
        
        # Create payload for server
        payload = {
            'model': 'claude-sonnet-4-5-20250929',
            'max_tokens': 200,
            'messages': [{
                'role': 'user',
                'content': content
            }]
        }
        
        # OPTIMIZATION 3: Add delay before sending request to server
        if len(photo_paths) >= 3:
            print(f"    ⏳ Adding delay for 3+ photos to reduce server load...")
            time.sleep(2)  # 2 second delay for 3+ photos
        
        # Send to server
        response = requests.post(f"{SERVER_URL}/analyze",
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=120
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            print(f"    ✅ Server Pipeline Success: {duration:.2f}s")
            return {
                'success': True,
                'duration': duration,
                'photos': photo_names,
                'method': 'server_pipeline',
                'response_size': len(response.text)
            }
        else:
            print(f"    ❌ Server Pipeline Failed: HTTP {response.status_code}")
            return {
                'success': False,
                'duration': duration,
                'photos': photo_names,
                'method': 'server_pipeline',
                'error': f"HTTP {response.status_code}"
            }
            
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        print(f"    ❌ Server Pipeline Error: {e}")
        return {
            'success': False,
            'duration': duration,
            'photos': photo_names,
            'method': 'server_pipeline',
            'error': str(e)
        }

def run_comparison_tests():
    """Run comparison tests between direct Claude and server pipeline"""
    print("🔬 Claude vs Server Comparison Test")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not API_KEY:
        print("❌ ANTHROPIC_API_KEY not found!")
        return
    
    # Setup
    ensure_results_folder()
    photos = get_photo_files()
    
    all_results = {
        'direct_claude': [],
        'server_pipeline': []
    }
    
    # Test 3 pictures with both methods
    print(f"\n📸 Testing 3 Pictures ({TEST_ITERATIONS['3_pictures']} tests each method)")
    print("=" * 60)
    
    for i in range(TEST_ITERATIONS['3_pictures']):
        selected_photos = random.sample(photos, 3)
        
        print(f"\n--- Test {i+1} ---")
        
        # Test direct Claude
        direct_result = test_direct_claude(selected_photos, i + 1)
        all_results['direct_claude'].append(direct_result)
        
        # Wait a bit between tests
        time.sleep(2)
        
        # Test server pipeline
        server_result = test_server_pipeline(selected_photos, i + 1)
        all_results['server_pipeline'].append(server_result)
        
        # Wait between iterations
        time.sleep(3)
    
    # Generate comparison report
    generate_comparison_report(all_results)
    
    print("\n" + "=" * 60)
    print("✅ Comparison test completed!")
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def generate_comparison_report(results):
    """Generate comparison report"""
    print("\n📊 GENERATING COMPARISON REPORT")
    print("=" * 60)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = os.path.join(RESULTS_FOLDER, f'comparison_{timestamp}.txt')
    
    with open(report_file, 'w') as f:
        f.write("Claude vs Server Comparison Test Results\n")
        f.write("=" * 50 + "\n")
        f.write(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Tests per method: {TEST_ITERATIONS['3_pictures']}\n\n")
        
        for method, test_results in results.items():
            successful_tests = [r for r in test_results if r['success']]
            failed_tests = [r for r in test_results if not r['success']]
            
            f.write(f"{method.replace('_', ' ').title()}:\n")
            f.write(f"  Tests: {len(test_results)} | Success: {len(successful_tests)} | Failed: {len(failed_tests)}\n")
            f.write(f"  Success Rate: {(len(successful_tests) / len(test_results)) * 100:.1f}%\n")
            
            if successful_tests:
                durations = [r['duration'] for r in successful_tests]
                f.write(f"  Average: {sum(durations)/len(durations):.2f}s\n")
                f.write(f"  Range: {min(durations):.2f}s - {max(durations):.2f}s\n")
                f.write(f"  Total: {sum(durations):.2f}s\n")
            else:
                f.write("  No successful tests\n")
            
            # Show error details
            if failed_tests:
                f.write("  Errors:\n")
                for test in failed_tests:
                    f.write(f"    - {test.get('error', 'Unknown error')}\n")
            
            f.write("\n")
        
        # Comparison summary
        direct_success = len([r for r in results['direct_claude'] if r['success']])
        server_success = len([r for r in results['server_pipeline'] if r['success']])
        
        f.write("COMPARISON SUMMARY:\n")
        f.write(f"Direct Claude Success Rate: {(direct_success / len(results['direct_claude'])) * 100:.1f}%\n")
        f.write(f"Server Pipeline Success Rate: {(server_success / len(results['server_pipeline'])) * 100:.1f}%\n")
        
        if direct_success > server_success:
            f.write("CONCLUSION: Direct Claude performs better - Server is the bottleneck\n")
        elif server_success > direct_success:
            f.write("CONCLUSION: Server pipeline performs better - Claude API is the bottleneck\n")
        else:
            f.write("CONCLUSION: Both methods perform similarly\n")
    
    print(f"📄 Comparison report saved: {report_file}")
    
    # Print summary to console
    print(f"\n📊 COMPARISON SUMMARY")
    print("=" * 60)
    
    for method, test_results in results.items():
        successful_tests = [r for r in test_results if r['success']]
        success_rate = (len(successful_tests) / len(test_results)) * 100
        
        print(f"\n{method.replace('_', ' ').title()}:")
        print(f"  Success Rate: {success_rate:.1f}%")
        
        if successful_tests:
            durations = [r['duration'] for r in successful_tests]
            print(f"  Average Time: {sum(durations)/len(durations):.2f}s")
            print(f"  Range: {min(durations):.2f}s - {max(durations):.2f}s")

if __name__ == "__main__":
    run_comparison_tests()
