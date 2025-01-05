import sys
from rembg import remove
from PIL import Image
import traceback
import onnxruntime as ort

def remove_background(input_path, output_path):
    try:
        print(f"Starting background removal for {input_path}", file=sys.stderr)
        
        # Force CPU provider
        ort.set_default_logger_severity(3)  # Reduce logging noise
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        providers = ['CPUExecutionProvider']
        ort.set_default_session_options(sess_options)
        ort.InferenceSession.set_providers(providers)
        
        # Read input image
        print(f"Opening input image...", file=sys.stderr)
        input_image = Image.open(input_path)
        
        # Remove background
        print(f"Removing background...", file=sys.stderr)
        output_image = remove(input_image)
        
        # Save the result
        print(f"Saving result to {output_path}...", file=sys.stderr)
        output_image.save(output_path)
        print("Success")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    remove_background(sys.argv[1], sys.argv[2]) 