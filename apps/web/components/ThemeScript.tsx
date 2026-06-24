/**
 * Tema FOUC önleyici — boyamadan ÖNCE <html data-theme> ayarlar (localStorage 'vesna-theme',
 * varsayılan koyu). ThemeToggle bunu çalıştırma anında değiştirir. layout <head>'inde render edilir.
 */
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('vesna-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
