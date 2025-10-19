#!/usr/bin/env python3
"""
Claude API Performance Test Script
Tests latency, consistency, and performance patterns
"""

import requests
import os
import time
import json
import base64
from datetime import datetime

# Test configurations
API_KEY = os.environ.get('ANTHROPIC_API_KEY')
BASE_URL = 'https://api.anthropic.com/v1/messages'

def create_test_image(size_kb=10):
    """Create a test image of specified size in KB"""
    # Create a simple colored rectangle as base64
    # This creates a 1x1 pixel image, we'll repeat it to reach target size
    pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    # Repeat pixel to reach target size (rough approximation)
    target_bytes = size_kb * 1024
    repeats = max(1, target_bytes // len(pixel))
    return pixel * repeats

def test_text_performance(text_length, iterations=3):
    """Test Claude performance with different text lengths"""
    print(f"\n📝 Testing TEXT performance ({text_length} chars, {iterations} iterations)")
    
    results = []
    text = "A" * text_length  # Simple repeated text
    
    for i in range(iterations):
        try:
            start_time = time.time()
            
            response = requests.post(BASE_URL, 
                headers={
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'claude-sonnet-4-5-20250929',
                    'max_tokens': 100,
                    'messages': [{'role': 'user', 'content': f'Count the characters in this text: {text}'}]
                },
                timeout=60
            )
            
            end_time = time.time()
            latency = end_time - start_time
            
            if response.status_code == 200:
                results.append(latency)
                print(f"  ✅ Iteration {i+1}: {latency:.2f}s")
            else:
                print(f"  ❌ Iteration {i+1}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Iteration {i+1}: {e}")
    
    if results:
        avg_latency = sum(results) / len(results)
        min_latency = min(results)
        max_latency = max(results)
        print(f"  📊 Results: avg={avg_latency:.2f}s, min={min_latency:.2f}s, max={max_latency:.2f}s")
        return avg_latency
    return None

def test_image_performance(image_count, image_size_kb, iterations=3):
    """Test Claude performance with different image configurations"""
    print(f"\n🖼️  Testing IMAGE performance ({image_count} images, {image_size_kb}KB each, {iterations} iterations)")
    
    results = []
    test_image = create_test_image(image_size_kb)
    
    for i in range(iterations):
        try:
            start_time = time.time()
            
            # Create message content with multiple images
            content = [{'type': 'text', 'text': f'Analyze these {image_count} images and describe what you see.'}]
            
            for j in range(image_count):
                content.append({
                    'type': 'image',
                    'source': {
                        'type': 'base64',
                        'media_type': 'image/jpeg',
                        'data': test_image
                    }
                })
            
            response = requests.post(BASE_URL,
                headers={
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'claude-sonnet-4-5-20250929',
                    'max_tokens': 200,
                    'messages': [{'role': 'user', 'content': content}]
                },
                timeout=60
            )
            
            end_time = time.time()
            latency = end_time - start_time
            
            if response.status_code == 200:
                results.append(latency)
                print(f"  ✅ Iteration {i+1}: {latency:.2f}s")
            else:
                print(f"  ❌ Iteration {i+1}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Iteration {i+1}: {e}")
    
    if results:
        avg_latency = sum(results) / len(results)
        min_latency = min(results)
        max_latency = max(results)
        print(f"  📊 Results: avg={avg_latency:.2f}s, min={min_latency:.2f}s, max={max_latency:.2f}s")
        return avg_latency
    return None

def main():
    print("🚀 Claude API Performance Test")
    print("=" * 50)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not API_KEY:
        print("❌ ANTHROPIC_API_KEY not found!")
        return
    
    # Test 1: Text performance (baseline)
    print("\n" + "="*50)
    print("📝 PHASE 1: Text Performance Baseline")
    print("="*50)
    
    text_tests = [
        (100, 3),    # 100 chars
        (1000, 3),   # 1K chars  
        (5000, 3),   # 5K chars
    ]
    
    for length, iterations in text_tests:
        test_text_performance(length, iterations)
    
    # Test 2: Image performance
    print("\n" + "="*50)
    print("🖼️  PHASE 2: Image Performance")
    print("="*50)
    
    image_tests = [
        (1, 10, 3),   # 1 image, 10KB
        (1, 100, 3),  # 1 image, 100KB
        (1, 500, 3),  # 1 image, 500KB
        (2, 100, 3),  # 2 images, 100KB each
        (3, 100, 3),  # 3 images, 100KB each
        (5, 100, 3),  # 5 images, 100KB each
    ]
    
    for image_count, image_size, iterations in image_tests:
        test_image_performance(image_count, image_size, iterations)
    
    # Test 3: Consistency test (same request multiple times)
    print("\n" + "="*50)
    print("🔄 PHASE 3: Consistency Test")
    print("="*50)
    
    print("Testing same request 5 times to check consistency...")
    consistency_results = []
    
    for i in range(5):
        try:
            start_time = time.time()
            
            response = requests.post(BASE_URL,
                headers={
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'claude-sonnet-4-5-20250929',
                    'max_tokens': 50,
                    'messages': [{'role': 'user', 'content': 'Say hello'}]
                },
                timeout=60
            )
            
            end_time = time.time()
            latency = end_time - start_time
            
            if response.status_code == 200:
                consistency_results.append(latency)
                print(f"  ✅ Request {i+1}: {latency:.2f}s")
            else:
                print(f"  ❌ Request {i+1}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Request {i+1}: {e}")
    
    if consistency_results:
        avg_latency = sum(consistency_results) / len(consistency_results)
        min_latency = min(consistency_results)
        max_latency = max(consistency_results)
        variance = max_latency - min_latency
        print(f"  📊 Consistency: avg={avg_latency:.2f}s, range={variance:.2f}s")
    
    print("\n" + "="*50)
    print("✅ Performance test completed!")
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
