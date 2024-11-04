const http = require('node:http');
const puppeteer = require('puppeteer'); // Изменен на require
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const htmlContent = fs.readFileSync('index.html', 'utf8');

const scraper = async (userUrl) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Переходим на указанный URL
  await page.goto(userUrl, { waitUntil: 'domcontentloaded' });
  
  // Устанавливаем размер экрана
  await page.setViewport({ width: 1080, height: 1024 });

  const title = await page.title();
  console.log('title: ', title);
  
  // // Вводим текст в поле поиска
  // await page.type('.devsite-search-field', 'automate beyond recorder');
  
  // // Ожидаем и кликаем по первой ссылке в результатах
  // await page.waitForSelector('.devsite-result-item-link');
  // await page.click('.devsite-result-item-link');
  
  // // Находим полный заголовок статьи по уникальному тексту
  // await page.waitForSelector('text/Customize and automate');
  // const fullTitle = await page.$eval('text/Customize and automate', el => el.textContent);
  
  // console.log('Заголовок статьи: "%s".', fullTitle);
  
  await browser.close();
  return title
};

const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    // const response = 'Hello! It is main page of service. If you want to scrapy of page, you need to go in /scrape'
    res.setHeader('Content-Type', 'text/html');
    res.end(htmlContent)
  } else if (req.url === '/scrape' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      console.log(chunk);
      body += chunk.toString();
    });
    req.on('end', async () => {
      const searchParams = new URLSearchParams(body);
      const url = searchParams.get('url');

      try {
        const result = await scraper(url);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(`Result: ${result}\n`);
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Error :(\n');
        console.error(error);
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Not found!\n');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server is starting in http://${hostname}:${port}/`);
});
