from PIL import Image, ImageDraw, ImageFont
import os

# Create screenshots directory if it doesn't exist
if not os.path.exists('screenshots'):
    os.makedirs('screenshots')

# Function to create context menu mockup screenshot
def create_contextmenu_screenshot():
    # Create a new image with white background
    width, height = 640, 400
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw browser chrome
    # Top bar
    draw.rectangle([(0, 0), (width, 40)], fill=(240, 240, 240))
    draw.line([(0, 40), (width, 40)], fill=(200, 200, 200), width=1)
    
    # Draw address bar
    address_bar_y = 8
    address_bar_height = 24
    address_bar_width = 450
    address_bar_x = 90
    
    draw.rectangle(
        [(address_bar_x, address_bar_y), 
         (address_bar_x + address_bar_width, address_bar_y + address_bar_height)],
        fill=(255, 255, 255),
        outline=(200, 200, 200),
        width=1
    )
    
    # Try to load a font
    try:
        normal_font = ImageFont.truetype("arial.ttf", 12)
        small_font = ImageFont.truetype("arial.ttf", 11)
    except:
        normal_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw page content
    form_x = 100
    form_y = 100
    
    # Form title
    draw.text((form_x, form_y), "Sign up for our newsletter", fill=(0, 0, 0), font=normal_font)
    form_y += 40
    
    # Email field label
    draw.text((form_x, form_y), "Email address:", fill=(0, 0, 0), font=normal_font)
    form_y += 25
    
    # Email field
    field_width = 250
    field_height = 30
    draw.rectangle(
        [(form_x, form_y), (form_x + field_width, form_y + field_height)],
        fill=(255, 255, 255),
        outline=(200, 200, 200),
        width=1
    )
    
    # Context menu
    menu_width = 220
    menu_height = 180
    menu_x = form_x + 50
    menu_y = form_y + 40
    
    # Context menu background
    draw.rectangle(
        [(menu_x, menu_y), (menu_x + menu_width, menu_y + menu_height)],
        fill=(255, 255, 255),
        outline=(200, 200, 200),
        width=1
    )
    
    # Menu items
    menu_padding = 10
    item_height = 25
    item_x = menu_x + menu_padding
    item_y = menu_y + menu_padding
    
    # Regular context menu items
    menu_items = [
        "Cut",
        "Copy",
        "Paste",
        "-------------",  # separator
        "Select all",
        "-------------",  # separator
    ]
    
    for item in menu_items:
        if "---" in item:
            # Draw separator
            draw.line(
                [(menu_x + 5, item_y + item_height/2), 
                 (menu_x + menu_width - 5, item_y + item_height/2)],
                fill=(220, 220, 220),
                width=1
            )
        else:
            # Draw menu item
            draw.text((item_x, item_y + 5), item, fill=(0, 0, 0), font=small_font)
        
        item_y += item_height
    
    # Extension menu item (highlighted)
    highlight_color = (240, 248, 255)  # Light blue highlight
    draw.rectangle(
        [(menu_x, item_y), (menu_x + menu_width, item_y + item_height)],
        fill=highlight_color
    )
    
    # Draw icon
    icon_size = 16
    icon_x = item_x
    icon_y = item_y + 4
    
    # Draw simplified icon (envelope with shield)
    draw.rectangle(
        [(icon_x, icon_y), (icon_x + icon_size, icon_y + icon_size)],
        fill=(230, 230, 230),
        outline=(200, 200, 200),
        width=1
    )
    # Draw triangle for shield
    shield_points = [
        (icon_x + icon_size/2, icon_y + 3),
        (icon_x + icon_size - 3, icon_y + 7),
        (icon_x + icon_size/2, icon_y + icon_size - 3),
        (icon_x + 3, icon_y + 7),
    ]
    draw.polygon(shield_points, fill=(76, 175, 80))
    
    # Extension menu item text
    draw.text((item_x + icon_size + 5, item_y + 5), 
              "Generate Spamgourmet Email", 
              fill=(0, 0, 0), 
              font=small_font)
    
    # Save the image
    output_path = 'screenshots/contextmenu_screenshot.png'
    img.save(output_path)
    print(f"Context menu screenshot created and saved to {output_path}")

if __name__ == "__main__":
    create_contextmenu_screenshot() 