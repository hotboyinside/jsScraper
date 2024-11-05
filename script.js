const searchArticles = async (event) => {
    event.preventDefault()

    const articleName = document.getElementById('articleName').value;
    const response = await fetch('/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ articleName })
      });
      
    if (response.ok) {
        const resultText = await response.text();
        displayResults(resultText);
    } else {
        console.log('Error occurred while scraping!')
    }
};

function displayResults(resultText) {
    const titlesListFromBackend = JSON.parse(resultText);
    const resultsList = document.getElementById('results');
    resultsList.innerHTML = '';
  
    titlesListFromBackend.forEach(title => {
      const titleElement = document.createElement('li');
      titleElement.className = 'article-title';
      titleElement.textContent = title;
      resultsList.appendChild(titleElement);
    });
  }