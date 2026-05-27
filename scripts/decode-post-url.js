const url = 'LzQwLz9xPVlUb3hPbnR6T2pFeU9pSnJaWGwzYjNKa1gzUjVjR1VpTzNNNk16b2lZV3hzSWp0OSZwYWdlPTg%3D';

// URL 디코드
const decoded = decodeURIComponent(url);
console.log('URL 디코드:', decoded);

// Base64 디코드
const base64Decoded = Buffer.from(decoded, 'base64').toString('utf-8');
console.log('Base64 디코드:', base64Decoded);
