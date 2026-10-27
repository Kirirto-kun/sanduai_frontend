// Server-rendered copy and plain CSS stay readable if the application cannot
// hydrate in an older browser. The independent ES5 guard only reveals this notice.
export function BrowserCompatibilityNotice() {
  return (
    <>
      <aside className="browser-compatibility-notice browser-compatibility-message" role="status">
        <p lang="ru">
          <strong>Браузер может не поддерживать Sandu AI.</strong>{" "}
          Обновите Chrome, Edge, Firefox или Safari и откройте сайт снова.
          Если это рабочий ноутбук, попросите администратора проверить версию и ограничения браузера.
        </p>
        <p lang="kk">
          <strong>Браузер Sandu AI жүйесін қолдамауы мүмкін.</strong>{" "}
          Chrome, Edge, Firefox немесе Safari браузерін жаңартып, сайтты қайта ашыңыз.
          Жұмыс ноутбугында әкімшіден браузер нұсқасы мен шектеулерін тексеруді сұраңыз.
        </p>
      </aside>
      <noscript>
        <div className="browser-compatibility-message">
          <p lang="ru">Для работы Sandu AI включите JavaScript в настройках браузера. Если настройка заблокирована, обратитесь к администратору ноутбука.</p>
          <p lang="kk">Sandu AI жүйесімен жұмыс істеу үшін браузер баптауларында JavaScript қосыңыз. Баптау бұғатталған болса, ноутбук әкімшісіне хабарласыңыз.</p>
        </div>
      </noscript>
    </>
  );
}
