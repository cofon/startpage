你可能没有明白我的意思，这是现在的结构：
<div data-v-4ba371f8="" data-v-7a7a37b1="" class="display-module">
  <!-- 已标记网站列表 --><!--v-if--><!-- 命令模式：设置面板 -->
  <div data-v-4ba371f8="" class="settings-panel">
    <div data-v-4ba371f8="" class="panel-header">
      <div data-v-4ba371f8="" class="header-left">
        <button data-v-4ba371f8="" class="header-button" title="主题">
          <span data-v-4ba371f8="" class="icon">🎨</span></button
        ><button data-v-4ba371f8="" class="header-button" title="搜索">
          <span data-v-4ba371f8="" class="icon">🔍</span></button
        ><button data-v-4ba371f8="" class="header-button" title="添加网站">
          <span data-v-4ba371f8="" class="icon">➕</span></button
        ><button data-v-4ba371f8="" class="header-button active" title="导入">
          <span data-v-4ba371f8="" class="icon">📥</span></button
        ><button data-v-4ba371f8="" class="header-button" title="导出">
          <span data-v-4ba371f8="" class="icon">📤</span>
        </button>
      </div>
      <button data-v-4ba371f8="" class="close-button" title="关闭">✕</button>
    </div>
    <div data-v-4ba371f8="" class="panel-content">
      <!-- 主题设置面板 --><!-- 导入面板 -->
      <div data-v-4ba371f8="" class="panel-section">
        <div data-v-5ebf40a8="" data-v-4ba371f8="" class="import-export-panel">
          <h3 data-v-5ebf40a8="">导入数据</h3>
          <p data-v-5ebf40a8="" class="description">
            从备份文件中导入网站和设置数据。
          </p>
          <button data-v-5ebf40a8="" class="action-button">
            <span data-v-5ebf40a8="" class="icon">📥</span> 选择文件导入</button
          ><input
            data-v-5ebf40a8=""
            type="file"
            accept=".json"
            style="display: none"
          />
        </div>
      </div>
    </div>
  </div>
  <!-- 命令模式：帮助面板 --><!--v-if-->
</div>

这是我想要的结构，以 导入数据的设置页 为例：
<div data-v-4ba371f8="" data-v-7a7a37b1="" class="display-module">
        <div data-v-5ebf40a8="" data-v-4ba371f8="" 
        class="import-export-panel">
          <h3 data-v-5ebf40a8="">导入数据</h3>
          <p data-v-5ebf40a8="" class="description">
            从备份文件中导入网站和设置数据。
          </p>
          <button data-v-5ebf40a8="" class="action-button">
            <span data-v-5ebf40a8="" class="icon">📥</span> 选择文件导入</button
          ><input
            data-v-5ebf40a8=""
            type="file"
            accept=".json"
            style="display: none"
          />
        </div>
</div>
