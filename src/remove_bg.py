import sys
from rembg import remove
from PIL import Image
import traceback
import onnxruntime as ort
import signal
from contextlib import contextmanager
import time
import os

# Force CPU provider and disable CoreML
os.environ['ONNXRUNTIME_PROVIDERS'] = 'CPUExecutionProvider'

class TimeoutException(Exception):
    pass

@contextmanager
def timeout(seconds):
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    
    # Register a function to raise a TimeoutException on the signal
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    
    try:
        yield
    finally:
        # Disable the alarm
        signal.alarm(0)

def remove_background(input_path, output_path):
    try:
        print(f"Starting background removal for {input_path}", file=sys.stderr)
        start_time = time.time()
        
        # Configure onnxruntime to use CPU provider
        print("Configuring onnxruntime...", file=sys.stderr)
        ort.set_default_logger_severity(3)  # Reduce logging noise
        
        # Read input image
        print(f"Opening input image...", file=sys.stderr)
        input_image = Image.open(input_path)
        original_size = input_image.size
        print(f"Image opened successfully. Original size: {original_size}", file=sys.stderr)
        
        # Resize image to 256x256 for faster processing
        print("Resizing image for processing...", file=sys.stderr)
        input_image = input_image.resize((256, 256), Image.Resampling.LANCZOS)
        print(f"Image resized to: {input_image.size}", file=sys.stderr)
        
        # Remove background with timeout
        print(f"Starting background removal process...", file=sys.stderr)
        with timeout(45):  # Increased timeout to 45 seconds
            output_image = remove(input_image)
            print(f"Background removal completed in {time.time() - start_time:.2f} seconds", file=sys.stderr)
        
        # Save the result
        print(f"Saving result to {output_path}...", file=sys.stderr)
        output_image.save(output_path) 
        print(f"Process completed successfully in {time.time() - start_time:.2f} seconds", file=sys.stderr)
        print("Success")
    except TimeoutException:
        print(f"Error: Background removal timed out after 45 seconds", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    remove_background(sys.argv[1], sys.argv[2]) 