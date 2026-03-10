"""
File Handler - 文件读写模块

功能：
- 读取 JSON 文件
- 保存 JSON 文件
- 解析起始页导出格式
"""

import json
import logging
from datetime import datetime


class FileHandler:
    """文件处理器
    
    主要功能：
    1. 读取起始页导出的 JSON 文件
    2. 保存网站数据到 JSON 文件
    3. 支持完整数据和部分数据的读写
    
    属性：
        logger (logging.Logger): 日志记录器
    """
    
    def __init__(self, logger=None):
        """初始化文件处理器
        
        Args:
            logger (logging.Logger, optional): 日志记录器
        """
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('WebsiteFetcher.FileHandler')
            if not self.logger.handlers:
                handler = logging.StreamHandler()
                handler.setFormatter(logging.Formatter('%(asctime)s\t%(levelname)s\t%(message)s'))
                self.logger.addHandler(handler)
                self.logger.setLevel(logging.INFO)
    
    def load_startpage_export(self, filename):
        """从起始页项目导出的 JSON 文件中加载 websites 数据
        
        起始页项目导出的 JSON 格式：
        {
          "websites": [{ website1 }, { website2 }, { website3 }],
          "settings": { settings },
          "themes": [{ theme1 }, { theme2 }, { theme3 }],
          "searchEngines": [{ searchEngine1 }, { searchEngine2 }, { searchEngine3 }]
        }
        
        Args:
            filename (str): 起始页导出的 JSON 文件名
            
       Returns:
            list[dict]: websites 数组，如果文件不存在或格式错误则返回空列表
        """
        full_data = self.load_startpage_export_full(filename)
        if full_data and 'websites' in full_data:
            return full_data['websites']
        return []
    
    def load_startpage_export_full(self, filename):
        """从起始页项目导出的 JSON 文件中加载完整数据
        
        Args:
            filename (str): 起始页导出的 JSON 文件名
            
        Returns:
            dict: 完整的导出数据，包含 websites、settings、themes、searchEngines
        """
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.logger.info('LOAD_EXPORT_SUCCESS\t%s\twebsites: %d', 
                           filename, len(data.get('websites', [])))
            return data
        except FileNotFoundError:
            self.logger.error('LOAD_EXPORT_ERROR\tFILE_NOT_FOUND\t%s', filename)
            return None
        except json.JSONDecodeError as e:
            self.logger.error('LOAD_EXPORT_ERROR\tJSON_DECODE_ERROR\t%s\t%s', filename, str(e))
            return None
        except Exception as e:
            self.logger.error('LOAD_EXPORT_ERROR\t%s\t%s\t%s', filename, type(e).__name__, str(e))
            return None
    
    def save_to_json(self, data, filename):
        """保存数据到 JSON 文件
        
        Args:
            data (list[dict]): 网站数据列表
            filename (str): 输出文件名
            
        Returns:
            bool: 是否保存成功
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.logger.info('SAVE_JSON_SUCCESS\t%s\t%d websites', filename, len(data))
            return True
        except Exception as e:
            self.logger.error('SAVE_JSON_ERROR\t%s\t%s\t%s', filename, type(e).__name__, str(e))
            return False
    
    def save_startpage_export(self, data, filename):
        """保存为起始页项目的完整导出格式
        
        Args:
            data (dict): 完整的数据，包含 websites、settings、themes、searchEngines
            filename (str): 输出文件名
            
        Returns:
            bool: 是否保存成功
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.logger.info('SAVE_EXPORT_SUCCESS\t%s', filename)
            return True
        except Exception as e:
            self.logger.error('SAVE_EXPORT_ERROR\t%s\t%s\t%s', filename, type(e).__name__, str(e))
            return False
    
    def create_backup_filename(self, prefix='startpage-backup'):
        """生成备份文件名（带时间戳）
        
        Args:
            prefix (str, optional): 文件名前缀，默认 'startpage-backup'
            
        Returns:
            str: 带时间戳的备份文件名
        """
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        return f'{prefix}-{timestamp}.json'
