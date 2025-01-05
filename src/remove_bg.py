import sys
from rembg import remove
from PIL import Image

def remove_background(input_path, output_path):
    try:
        # Read input image
        input_image = Image.open(input_path)
        
        # Remove background
        output_image = remove(input_image)
        
        # Save the result
        output_image.save(output_path)
        print("Success")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    remove_background(sys.argv[1], sys.argv[2]) 