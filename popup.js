document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('apiKey');
  const serverUrlInput = document.getElementById('serverUrl');
  const noteInput = document.getElementById('note');
  const sendButton = document.getElementById('sendButton');

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

  sendButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value;
    const serverUrl = serverUrlInput.value;
    const note = noteInput.value;

    if (!apiKey) {
      alert("Podaj API KEY");
      return;
    }

    if (!apiKey || !serverUrl) {
      alert("Podaj API Key i adres serwera");
      return;
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
          language: document.documentElement.lang || navigator.language // Pobieramy język strony
        })
      })
          .then(result => {
            const { text, title, language } = result[0].result;
            const data = {
              note: note,
              url: pageUrl,
              type: "webpage",
              text: text,
              title: title,
              language: language // Dodajemy język strony do wysyłanych danych
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
