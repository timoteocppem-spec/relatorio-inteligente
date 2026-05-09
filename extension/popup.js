// Troque pela URL do seu deploy na Vercel
const APP_URL = 'https://SEU-PROJETO.vercel.app'

document.getElementById('openBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: APP_URL })
  window.close()
})
