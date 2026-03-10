"""
生成插件图标（需要 Pillow 库）
pip install Pillow
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """创建指定尺寸的图标"""
    # 创建图像
    img = Image.new('RGB', (size, size), color='#2196F3')
    draw = ImageDraw.Draw(img)
    
    # 绘制渐变背景（简化为纯色）
    draw.rectangle([0, 0, size-1, size-1], fill='#2196F3')
    
    # 尝试加载字体
    try:
        font_size = int(size * 0.6)
        # Windows 系统字体路径
        font_paths = [
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/msyh.ttc',  # 微软雅黑
        ]
        
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break
        
        if font is None:
            font = ImageFont.load_default()
    except Exception as e:
        print(f"字体加载失败：{e}")
        font = ImageFont.load_default()
    
    # 绘制字母 S
    text = "S"
    # 计算文本位置使其居中
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width= bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    # 保存图标
    filename= f'icon{size}.png'
    img.save(filename)
    print(f"✓ 已生成：{filename}")

if __name__ == '__main__':
    # 创建三个尺寸的图标
    for size in [16, 48, 128]:
        create_icon(size)
    
    print("\n图标已生成到当前目录，请移动到 icons 文件夹")
