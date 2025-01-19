document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('apiKey');
  const serverUrlInput = document.getElementById('serverUrl');
  const noteInput = document.getElementById('note');
  const sendButton = document.getElementById('sendButton');
  const paywallInputs = document.getElementsByName('paywall');
  const typeSelect = document.getElementById('type');
  const sourceSelect = document.getElementById('source');
  const ai_summary = document.getElementsByName('ai_summary');
  const ai_correction = document.getElementsByName('ai_correction');
  const chapter_list = document.getElementById('chapter_list');
  const chapterListContainer= document.getElementById('chapterListContainer');

  function toggleChapterListVisibility() {
    if (typeSelect.value === 'youtube') {
      chapterListContainer.style.display = 'block';
    } else {
      chapterListContainer.style.display = 'none';
    }
  }

  toggleChapterListVisibility();

  typeSelect.addEventListener('change', toggleChapterListVisibility);


  chrome.storage.sync.get(['apiKey', 'serverUrl'], function (data) {
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    if (data.serverUrl) serverUrlInput.value = data.serverUrl;
  });

  apiKeyInput.addEventListener('change', function () {
    chrome.storage.sync.set({ apiKey: apiKeyInput.value });
  });

  serverUrlInput.addEventListener('change', function () {
    chrome.storage.sync.set({ serverUrl: serverUrlInput.value });
  });

  // Dodane: Automatyczne ustawienie typu na 'YouTube' przy odpowiednim adresie URL
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    const pageUrl = tabs[0].url;
    if (pageUrl.startsWith('https://www.youtube.com/watch') || pageUrl.startsWith('http://www.youtube.com/watch')) {
      typeSelect.value = 'youtube';
      chapterListContainer.style.display = 'block';
    }

    chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => document.title,
        },
        (results) => {

          const pageTitleInput = document.getElementById('pageTitle');

          // Debugowanie odpowiedzi z executeScript
          if (!results || !results[0] || chrome.runtime.lastError) {
            console.error("Error in executeScript:", chrome.runtime.lastError);
            console.log("Results:", results);
            pageTitleInput.value = 'Nie udało się pobrać tytułu';
          } else {
            pageTitleInput.value = results[0].result; // Ustaw tytuł w polu tekstowym
          }


        }
    );

  });

  sendButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value;
    const serverUrl = serverUrlInput.value;
    const note = noteInput.value;
    const type = typeSelect.value;
    const title = document.getElementById('pageTitle').value;


    if (!apiKey) {
      alert("Podaj API KEY");
      return;
    }

    if (!serverUrl) {
      alert("Podaj adres serwera");
      return;
    }

    let paywall;
    for (const input of paywallInputs) {
      if (input.checked) {
        paywall = input.value === 'true';
        break;
      }
    }

    sendButton.style.backgroundColor = 'gray';
    sendButton.disabled = true;
    sendButton.textContent = 'Wysyłam...';

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const pageUrl = tabs[0].url;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => ({
          text: document.documentElement.innerText,
          html: document.documentElement.outerHTML,
          language: document.documentElement.lang || navigator.language
        })
      })
          .then(result => {
            const { text, html, language } = result[0].result;
            const data = {
              note: note,
              url: pageUrl,
              type: type,
              text: text,
              html: html,
              title: title,
              language: language,
              paywall: paywall,
              source: sourceSelect.value,
              ai_summary: Array.from(ai_summary).find(radio => radio.checked)?.value || null,
              ai_correction: Array.from(ai_correction).find(radio => radio.checked)?.value || null,
              chapter_list: chapter_list.value
            };

            return fetch(serverUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
              },
              body: JSON.stringify(data)
            });
          })
          .then(() => {
            alert('Strona została dodana pomyślnie!');
            noteInput.value = '';
            setTimeout(() => window.close(), 500);
          })
          .catch(error => {
            alert('Błąd podczas wysyłania strony.');
            console.error('Error:', error);
          })
          .finally(() => {
            sendButton.style.backgroundColor = '';
            sendButton.disabled = false;
            sendButton.textContent = 'Wyślij';
          });
    });
  });
});
