from PIL import Image, ImageDraw, ImageFont
import os

# Create screenshots directory if it doesn't exist
if not os.path.exists('screenshots'):
    os.makedirs('screenshots')

# Function to create popup mockup screenshot
def create_popup_screenshot():
    # Create a new image with white background
    width, height = 640, 400
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw browser chrome
    # Top bar
    draw.rectangle([(0, 0), (width, 40)], fill=(240, 240, 240))
    draw.line([(0, 40), (width, 40)], fill=(200, 200, 200), width=1)
    
    # Draw popup window
    popup_width, popup_height = 300, 340
    popup_x = (width - popup_width) // 2
    popup_y = 50
    
    # Popup background
    draw.rectangle(
        [(popup_x, popup_y), (popup_x + popup_width, popup_y + popup_height)],
        fill=(255, 255, 255),
        outline=(200, 200, 200),
        width=2
    )
    
    # Popup header
    header_height = 40
    draw.rectangle(
        [(popup_x, popup_y), (popup_x + popup_width, popup_y + header_height)],
        fill=(76, 175, 80),  # Green background
    )
    
    # Try to load a font
    try:
        title_font = ImageFont.truetype("arial.ttf", 16)
        label_font = ImageFont.truetype("arial.ttf", 12)
        button_font = ImageFont.truetype("arial.ttf", 12)
    except:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
        button_font = ImageFont.load_default()
    
    # Draw popup title
    title = "Spamgourmet Email Generator"
    title_position = (popup_x + 10, popup_y + 10)
    draw.text(title_position, title, fill=(255, 255, 255), font=title_font)
    
    # Form elements
    form_x = popup_x + 20
    form_y = popup_y + header_height + 20
    field_width = popup_width - 40
    field_height = 30
    field_margin = 15
    
    # Website field
    draw.text((form_x, form_y), "Website or purpose:", fill=(0, 0, 0), font=label_font)
    form_y += 20
    draw.rectangle(
        [(form_x, form_y), (form_x + field_width, form_y + field_height)],
        fill=(255, 255, 255),
        outline=(200, 200, 200),
        width=1
    )
    draw.text((form_x + 5, form_y + 5), "amazon", fill=(0, 0, 0), font=label_font)
    form_y += field_height + field_margin
    
    # Number of messages field
    draw.text((form_x, form_y), "Number of messages:", fill=(0, 0, 0), font=label_font)
    form_y += 20
    draw.rectangle(
        [(form_x, form_y), (form_x + field_width, form_y + field_height)],
        fill=(255, 255, 255),
        outline=(200, 200, 200),
        width=1
    )
    draw.text((form_x + 5, form_y + 5), "5", fill=(0, 0, 0), font=label_font)
    form_y += field_height + field_margin
    
    # Generated email field
    draw.text((form_x, form_y), "Generated email:", fill=(0, 0, 0), font=label_font)
    form_y += 20
    draw.rectangle(
        [(form_x, form_y), (form_x + field_width, form_y + field_height)],
        fill=(240, 240, 240),
        outline=(200, 200, 200),
        width=1
    )
    email = "amazon.5.user@spamgourmet.com"
    draw.text((form_x + 5, form_y + 5), email, fill=(0, 0, 0), font=label_font)
    form_y += field_height + field_margin
    
    # Generate button
    button_width = 120
    button_height = 30
    button_x = form_x + (field_width - button_width) // 2
    button_y = form_y + 10
    
    draw.rectangle(
        [(button_x, button_y), (button_x + button_width, button_y + button_height)],
        fill=(76, 175, 80),  # Green button
        outline=(56, 142, 60),
        width=1
    )
    
    button_text = "Copy to Clipboard"
    text_width = 100
    text_height = 10
    text_x = button_x + (button_width - text_width) // 2 + 10
    text_y = button_y + (button_height - text_height) // 2
    draw.text((text_x, text_y), button_text, fill=(255, 255, 255), font=button_font)
    
    # Save the image
    output_path = 'screenshots/popup_screenshot.png'
    img.save(output_path)
    print(f"Screenshot created and saved to {output_path}")

if __name__ == "__main__":
    create_popup_screenshot() 