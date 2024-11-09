const puppeteer = require('puppeteer');
const path = require('path');
const http = require('node:http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const htmlContent = fs.readFileSync('index.html', 'utf8');

const scraper = async (articleName) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // Переходим на указанный URL
  await page.goto('https://habr.com', { waitUntil: 'domcontentloaded' });
  // Устанавливаем размер экрана
  await page.setViewport({ width: 1024, height: 768 });
  // дожидаемся рендера иконки
  await page.waitForSelector('.tm-header-user-menu__icon_search', { visible: true });
  // Нажимаем на кнопку поиска по статьям в нав. меню
  await page.click('.tm-header-user-menu__icon_search');
  // дожидаемся рендера input
  await page.waitForSelector('.tm-input-text-decorated__input');
  // в новое поле добавляем тему на которую будем искать и нажимаем на иконку поиска
  await page.type('.tm-input-text-decorated__input', articleName);
  // Нажимаем на кнопку поиска по статьям
  await page.waitForSelector('.tm-svg-icon__wrapper');
  await page.click('.tm-svg-icon__wrapper');

  let Alltitles = [];
  let search = true;
  
  while (search) {
    // ждем пока отобразится пагинация, значит названия статей уже появлились
    await page.waitForSelector('.tm-pagination__pages');
    const titles = await page.$$eval('.tm-title_h2', titles => {
      return titles.map(title => title.textContent);
    });

    Alltitles.push(...titles);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForSelector('[data-test-id="pagination-next-page"]');
    const nextPageBtn = await page.$('[data-test-id="pagination-next-page"]');

    const hasClass = await page.evaluate((el, className) => el?.classList.contains(className), nextPageBtn, 'tm-pagination__navigation-link_active');

    if (hasClass) {
      nextPageBtn.click()
    } else {
      search = false;
    }
  }

  await browser.close();
  return Alltitles
};

const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(htmlContent)
  } else if (req.url === '/scrape' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const searchParams = new URLSearchParams(body);
      const articleName = searchParams.get('articleName');

      try {
        const result = await scraper(articleName);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Error :(\n');
        console.error(error);
      }
    });
  } else if (req.url === '/script.js' && req.method === 'GET') {
    const scriptPath = path.join(__dirname, 'script.js');
    fs.readFile(scriptPath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Script not found');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript');
        res.end(data);
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
