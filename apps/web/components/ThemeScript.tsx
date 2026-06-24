/**
 * Tema FOUC önleyici — boyamadan ÖNCE <html data-theme> ayarlar (localStorage 'vesna-theme',
 * varsayılan koyu). ThemeToggle bunu çalıştırma anında değiştirir. layout <head>'inde render edilir.
 */
export function ThemeScript() {
  // ?theme=light|dark URL parametresi varsa onu kullan (cache/localStorage bypass — test + paylaşım kolaylığı),
  // yoksa localStorage, yoksa koyu. Parametre verildiğinde localStorage'a da yazar (kalıcı olsun).
  const js = `(function(){try{var p=new URLSearchParams(location.search).get('theme');var t=(p==='light'||p==='dark')?p:localStorage.getItem('vesna-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t;if(p==='light'||p==='dark')localStorage.setItem('vesna-theme',t);}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
