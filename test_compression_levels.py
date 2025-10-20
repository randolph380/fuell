#!/usr/bin/env python3
"""
Compression Level Test - Test 3-photo requests with different compression levels
Tests: Normal, 5x smaller, 10x smaller compression
"""

import requests
import json
import time
import os
import random
import base64
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

def compress_image_with_level(image_path, compression_level="normal"):
    """Compress image with different compression levels"""
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
            
            # Apply compression level settings
            if compression_level == "normal":
                max_width = 1600
                quality = 0.7
            elif compression_level == "5x_smaller":
                max_width = 800  # Half the width
                quality = 0.3     # Much lower quality
            elif compression_level == "10x_smaller":
                max_width = 600  # Even smaller
                quality = 0.2     # Very low quality
            
            # Resize if too large
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Compress
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=int(quality * 100), optimize=True)
            compressed_data = output.getvalue()
            
            # If still too large, compress more (only for normal compression)
            if compression_level == "normal" and len(compressed_data) > 5 * 1024 * 1024:  # 5MB
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

def test_compression_level(photo_paths, compression_level, test_name):
    """Test server request with specific compression level"""
    photo_names = [os.path.basename(p) for p in photo_paths]
    print(f"  🧪 {test_name} ({compression_level}): {', '.join(photo_names)}")
    
    start_time = time.time()
    
    try:
        # Process images with specified compression
        compressed_images = []
        total_size = 0
        
        for i, photo_path in enumerate(photo_paths):
            print(f"    📸 Processing image {i+1}/{len(photo_paths)}...")
            compressed_image = compress_image_with_level(photo_path, compression_level)
            if compressed_image:
                compressed_images.append(compressed_image)
                size_kb = len(compressed_image) / 1024
                total_size += size_kb
                print(f"    📏 Compressed: {size_kb:.1f}KB")
            else:
                print(f"    ❌ Failed to compress {photo_path}")
                return None
        
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
        
        print(f"    🌐 Sending request...")
        print(f"    📊 Total payload size: {len(json.dumps(payload))/1024:.1f}KB")
        print(f"    📊 Image data size: {total_size:.1f}KB")
        
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
                'compression_level': compression_level,
                'test_name': test_name,
                'photos': photo_names,
                'payload_size_kb': len(json.dumps(payload))/1024,
                'image_size_kb': total_size
            }
        else:
            print(f"    ❌ Failed: HTTP {response.status_code}")
            print(f"    📄 Response: {response.text[:200]}...")
            return {
                'success': False,
                'duration': duration,
                'compression_level': compression_level,
                'test_name': test_name,
                'photos': photo_names,
                'error': f"HTTP {response.status_code}",
                'payload_size_kb': len(json.dumps(payload))/1024,
                'image_size_kb': total_size
            }
            
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        print(f"    ❌ Exception: {e}")
        return {
            'success': False,
            'duration': duration,
            'compression_level': compression_level,
            'test_name': test_name,
            'photos': photo_names,
            'error': str(e)
        }

def run_compression_tests():
    """Run compression level tests"""
    print("🔬 Compression Level Test - 3 Photos, Different Compression")
    print("="*70)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not API_KEY:
        print("❌ ANTHROPIC_API_KEY not found!")
        print("💡 Run with: ANTHROPIC_API_KEY='your_key' python3 test_compression_levels.py")
        return
    
    # Get photos
    photos = get_photo_files()
    print(f"📸 Found {len(photos)} photos")
    
    all_results = []
    
    # Test each compression level with 3 attempts
    compression_levels = ["normal", "5x_smaller", "10x_smaller"]
    
    for compression_level in compression_levels:
        print(f"\n📸 TESTING: {compression_level.upper()} COMPRESSION")
        print("="*70)
        
        for attempt in range(3):
            # Select 3 random photos
            selected_photos = random.sample(photos, 3)
            test_name = f"{compression_level}-{attempt+1}"
            
            result = test_compression_level(selected_photos, compression_level, test_name)
            all_results.append(result)
            
            # Small delay between tests
            time.sleep(2)
    
    # Generate comprehensive report
    print(f"\n📊 COMPRESSION TEST RESULTS")
    print("="*70)
    
    # Group results by compression level
    for compression_level in compression_levels:
        level_results = [r for r in all_results if r and r.get('compression_level') == compression_level]
        successful = [r for r in level_results if r.get('success')]
        failed = [r for r in level_results if not r.get('success')]
        
        print(f"\n{compression_level.upper()} COMPRESSION:")
        print(f"  Success Rate: {len(successful)}/{len(level_results)} ({len(successful)/len(level_results)*100:.1f}%)")
        
        if successful:
            avg_duration = sum(r.get('duration', 0) for r in successful) / len(successful)
            avg_payload = sum(r.get('payload_size_kb', 0) for r in successful) / len(successful)
            avg_image = sum(r.get('image_size_kb', 0) for r in successful) / len(successful)
            print(f"  Average Duration: {avg_duration:.2f}s")
            print(f"  Average Payload Size: {avg_payload:.1f}KB")
            print(f"  Average Image Size: {avg_image:.1f}KB")
        
        if failed:
            print(f"  Failed Tests: {len(failed)}")
            for fail in failed:
                print(f"    - {fail.get('test_name', 'Unknown')}: {fail.get('error', 'Unknown error')}")
    
    # Overall summary
    print(f"\n📊 OVERALL SUMMARY")
    print("="*70)
    total_tests = len(all_results)
    total_successful = len([r for r in all_results if r and r.get('success')])
    total_failed = len([r for r in all_results if r and not r.get('success')])
    
    print(f"Total Tests: {total_tests}")
    print(f"Successful: {total_successful} ({total_successful/total_tests*100:.1f}%)")
    print(f"Failed: {total_failed} ({total_failed/total_tests*100:.1f}%)")
    
    # Find the best compression level
    best_level = None
    best_success_rate = 0
    
    for compression_level in compression_levels:
        level_results = [r for r in all_results if r and r.get('compression_level') == compression_level]
        if level_results:
            success_rate = len([r for r in level_results if r.get('success')]) / len(level_results)
            if success_rate > best_success_rate:
                best_success_rate = success_rate
                best_level = compression_level
    
    if best_level:
        print(f"\n🏆 BEST COMPRESSION LEVEL: {best_level.upper()}")
        print(f"   Success Rate: {best_success_rate*100:.1f}%")
    
    print(f"\n⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    print("✅ Compression test completed!")

if __name__ == "__main__":
    run_compression_tests()
