// 基础测试文件
console.log('Hello, World!');

// 简单的函数测试
function sayHello(name) {
  return `Hello, ${name}!`;
}

// 测试函数
console.log(sayHello('Test'));

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sayHello };
}
