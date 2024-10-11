document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('apiKey');
  const serverUrlInput = document.getElementById('serverUrl');
  const noteInput = document.getElementById('note');
  const sendButton = document.getElementById('sendButton');
  const paywallInputs = document.getElementsByName('paywall');
  const typeSelect = document.getElementById('type');

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
    }
  });

  sendButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value;
    const serverUrl = serverUrlInput.value;
    const note = noteInput.value;
    const type = typeSelect.value;

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
          title: document.title,
          language: document.documentElement.lang || navigator.language
        })
      })
          .then(result => {
            const { text, title, language } = result[0].result;
            const data = {
              note: note,
              url: pageUrl,
              type: type,
              text: text,
              title: title,
              language: language,
              paywall: paywall
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
            alert('Notatka została wysłana pomyślnie!');
            noteInput.value = '';
            setTimeout(() => window.close(), 500);
          })
          .catch(error => {
            alert('Błąd podczas wysyłania notatki.');
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
