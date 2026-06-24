/**
 * Tema FOUC önleyici — boyamadan ÖNCE <html data-theme> ayarlar (localStorage 'vesna-theme',
 * varsayılan koyu). ThemeToggle bunu çalıştırma anında değiştirir. layout <head>'inde render edilir.
 */
export function ThemeScript() {
  // ?theme=light|dark URL parametresi varsa onu kullan (cache/localStorage bypass — test + paylaşım kolaylığı),
  // yoksa localStorage, yoksa koyu. URL parametresi TEK SEFERLİK override'dır; kullanıcının kayıtlı
  // tercihini (localStorage) EZMEZ — paylaşılan link kişinin temasını kalıcı değiştirmesin.
  const js = `(function(){try{var p=new URLSearchParams(location.search).get('theme');var t=(p==='light'||p==='dark')?p:localStorage.getItem('vesna-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
