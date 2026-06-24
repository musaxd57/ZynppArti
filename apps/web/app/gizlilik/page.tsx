import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni — Vesna',
  description: 'Vesna (vesna.design) gizlilik politikası, KVKK aydınlatma metni ve veri işleme esasları.',
};

/** Yürürlük tarihi — politika değişince güncelle. */
const EFFECTIVE = '24 Haziran 2026';
/** Son güncelleme — her revizyonda değiştir. */
const UPDATED = '24 Haziran 2026';
/**
 * Veri sorumlusu iletişim — Moses doğrulamalı/güncellemeli.
 * Öneri: domain e-postası kur (iletisim@vesna.design) ve burayı onunla değiştir (daha kurumsal).
 */
const CONTACT_EMAIL = 'musacinar2009@gmail.com';

/**
 * Gizlilik Politikası + KVKK aydınlatma metni (statik sayfa). İçerik docs/COMPLIANCE.md çerçevesine
 * ve gerçek veri akışına dayanır: çizim verisi istemcide kalır, AI istekleri 3. parti sağlayıcılara
 * (yurtdışı) gider, sunucuda kalıcı kullanıcı verisi tutulmaz. NOT: hukuki danışmanlık değildir;
 * ürün büyüyüp ödeme/hesap eklenince KVKK/GDPR uzmanı doğrulaması alınmalı.
 */
export default function GizlilikPage() {
  return (
    <main
      className="mx-auto min-h-screen max-w-3xl px-6 py-12"
      style={{ background: 'var(--surface-0, #0E0E10)', color: 'var(--text-1, #e8e8ea)' }}
    >
      <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--accent-text, #a5a5ff)' }}>
        ← Uygulamaya dön
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-3, #9a9aa2)' }}>
        Yürürlük tarihi: {EFFECTIVE} · Son güncelleme: {UPDATED} · Hizmet: <strong>Vesna</strong> (vesna.design)
      </p>

      <Section title="1. Giriş ve Kapsam">
        <P>
          Bu Gizlilik Politikası ve Aydınlatma Metni (“Politika”), <strong>Vesna</strong> adlı, tarayıcı
          üzerinden çalışan mimari/iç mimari tasarım uygulamasını (“Hizmet”, “Uygulama”) kullanımınız
          sırasında kişisel verilerinizin nasıl işlendiğini, hangi amaçlarla kullanıldığını, kimlerle
          paylaşıldığını ve haklarınızı açıklar.
        </P>
        <P>
          Politika; 6698 sayılı <strong>Kişisel Verilerin Korunması Kanunu</strong> (“KVKK”) kapsamında
          aydınlatma yükümlülüğümüzü yerine getirmek amacıyla hazırlanmıştır. Avrupa Birliği’nde bulunan
          kullanıcılar bakımından, geçerli olduğu ölçüde Genel Veri Koruma Tüzüğü (“GDPR”) ilkeleri de göz
          önünde bulundurulur.
        </P>
        <P>
          Hizmet’i kullanarak bu Politika’da açıklanan veri işleme esaslarını okuduğunuzu ve anladığınızı
          kabul edersiniz. Uygulamayı kullanmaya başlamadan önce bu metni dikkatle incelemenizi öneririz.
        </P>
      </Section>

      <Section title="2. Veri Sorumlusu ve İletişim">
        <P>
          İşbu Hizmet bireysel olarak işletilmektedir. KVKK kapsamında veri sorumlusuna ilişkin
          sorularınızı, başvurularınızı ve taleplerinizi aşağıdaki iletişim kanalı üzerinden iletebilirsiniz:
        </P>
        <P>
          E-posta:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent-text, #a5a5ff)' }}>
            {CONTACT_EMAIL}
          </a>
        </P>
        <P>
          Başvurularınız, mevzuatta öngörülen süreler içinde ve ücretsiz olarak (işlemin ayrıca bir maliyet
          gerektirmesi hâli saklıdır) sonuçlandırılır.
        </P>
      </Section>

      <Section title="3. Tanımlar">
        <Ul>
          <li><strong>Kişisel veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi.</li>
          <li><strong>İşleme:</strong> Verinin elde edilmesi, kaydedilmesi, aktarılması, saklanması gibi her türlü işlem.</li>
          <li><strong>İstemci (client):</strong> Uygulamayı çalıştıran tarayıcınız ve cihazınız.</li>
          <li><strong>Proje/çizim verisi:</strong> Uygulamada oluşturduğunuz planlar, mahaller, ölçüler, notlar ve benzeri içerik.</li>
          <li><strong>Üçüncü taraf sağlayıcı:</strong> Hizmet’in çalışması için kullanılan dış servisler (barındırma ve yapay zekâ sağlayıcıları).</li>
        </Ul>
      </Section>

      <Section title="4. İşlenen Veri Kategorileri">
        <P>Hizmet’i kullanımınız sırasında aşağıdaki veri kategorileri söz konusu olabilir:</P>
        <Ul>
          <li>
            <strong>Proje / çizim verisi:</strong> Tarayıcınızın belleğinde tutulur ve yalnızca siz
            “Kaydet” işlemini yaptığınızda cihazınıza bir dosya (JSON) olarak iner. Bu veri,
            sunucularımızda kalıcı olarak <strong>saklanmaz</strong>.
          </li>
          <li>
            <strong>Yapay zekâ istek verisi:</strong> “Sor”, “Çiz” veya “Render” özelliklerini
            kullandığınızda; yazdığınız metin (komut/soru) ve projenizin özet bilgileri (örneğin oda
            sayısı, yaklaşık m², duvar/kapı sayıları) yanıt üretilmesi amacıyla ilgili yapay zekâ
            sağlayıcısına iletilir.
          </li>
          <li>
            <strong>Canlı işbirliği verisi (opsiyonel):</strong> “Canlı Paylaş” özelliğini açtığınızda; o
            oturum süresince çiziminiz ve imleç/seçim konumunuz, davet ettiğiniz katılımcılarla anlık
            olarak paylaşılır. Bu veri kalıcı olarak saklanmaz; oturum sona erdiğinde kaybolur.
          </li>
          <li>
            <strong>Yüklediğiniz dosyalar:</strong> DXF/DWG gibi dosyaları içe aktardığınızda, bunlar
            tarayıcınızda işlenir; sunucuya yüklenmez (DWG dönüşümü dahil işlem tarayıcı içinde gerçekleşir).
          </li>
          <li>
            <strong>Teknik kayıt ve bağlantı verileri:</strong> Barındırma sağlayıcıları (Vercel, Railway),
            hizmetin güvenli ve kesintisiz çalışması için standart sunucu kayıtları (örneğin IP adresi,
            tarayıcı türü, erişim zamanı) tutabilir.
          </li>
          <li>
            <strong>Arayüz tercihleri:</strong> Açık paneller, dock genişliği gibi tercihler tarayıcınızın
            yerel depolamasında (localStorage) saklanır ve cihazınızdan çıkmaz.
          </li>
        </Ul>
        <P>
          Hâlihazırda hesap oluşturma bulunmadığından <strong>ad, parola veya ödeme bilgisi</strong>
          toplanmamaktadır. İleride hesap/ödeme özellikleri eklenirse bu Politika güncellenecek ve ek
          aydınlatma yapılacaktır.
        </P>
      </Section>

      <Section title="5. İşleme Amaçları">
        <Ul>
          <li>Talep ettiğiniz tasarım işlevlerini yerine getirmek (çizim, ölçü, mahal hesabı, dışa aktarma).</li>
          <li>Yapay zekâ özellikleri aracılığıyla istediğiniz öneri, plan veya görseli üretmek.</li>
          <li>Canlı işbirliği oturumunu sağlamak ve sürdürmek.</li>
          <li>Hizmet’in güvenliğini sağlamak, kötüye kullanımı (örn. aşırı istek/DoS) önlemek.</li>
          <li>Hizmet’i çalıştırmak, hataları gidermek ve teknik bakımı yürütmek.</li>
        </Ul>
      </Section>

      <Section title="6. Hukuki Sebepler (KVKK m. 5)">
        <P>Kişisel verileriniz, niteliğine göre aşağıdaki hukuki sebeplere dayanılarak işlenir:</P>
        <Ul>
          <li>Bir hizmetin sunulması için işlemenin <strong>gerekli olması</strong> (talep ettiğiniz işlevin yerine getirilmesi).</li>
          <li>Veri sorumlusunun <strong>meşru menfaati</strong> (hizmet güvenliği, kötüye kullanımın önlenmesi, hizmetin iyileştirilmesi).</li>
          <li>İlgili kişinin <strong>açık rızası</strong> (zorunlu olmayan, rızaya bağlı işlemler bakımından — örneğin gelecekte eklenebilecek analitik).</li>
          <li>Veri sorumlusunun <strong>hukuki yükümlülüğünü</strong> yerine getirmesi (mevzuat gereği gerekli hâllerde).</li>
        </Ul>
      </Section>

      <Section title="7. Üçüncü Taraf Sağlayıcılar ve Yurt Dışına Aktarım">
        <P>
          Yapay zekâ yanıtlarının üretilmesi için isteğiniz, performans ve içeriğe göre aşağıdaki
          sağlayıcılardan birine iletilebilir:
        </P>
        <Ul>
          <li><strong>OpenAI</strong> — doğal dil yanıtları ve görsel (render) üretimi.</li>
          <li><strong>Anthropic</strong> — karmaşık/yönetmelik içeren sorular için yanıt üretimi.</li>
          <li><strong>AkashML</strong> — yedek dil modeli sağlayıcısı.</li>
        </Ul>
        <P>
          Hizmet’in barındırılması için <strong>Vercel</strong> (web uygulaması) ve <strong>Railway</strong>
          (canlı işbirliği sunucusu) kullanılır.
        </P>
        <P>
          Bu sağlayıcıların sunucuları büyük olasılıkla <strong>yurt dışında</strong> bulunmaktadır.
          Dolayısıyla yapay zekâ özelliklerini kullandığınızda verileriniz <strong>yurt dışına aktarılmış</strong>
          olur. Yapay zekâ özelliklerini kullanmamayı tercih ederek bu aktarımdan kaçınabilirsiniz; bu
          durumda temel çizim işlevleri çalışmaya devam eder. Her bir sağlayıcının kendi gizlilik ve veri
          işleme politikaları geçerlidir.
        </P>
      </Section>

      <Section title="8. Saklama Süreleri">
        <P>
          Proje/çizim verileriniz ve canlı işbirliği verileri tarafımızca <strong>kalıcı olarak
          saklanmaz</strong>; işleme yalnızca talep ettiğiniz işlevin yerine getirilmesi süresince geçerlidir.
          Yapay zekâ sağlayıcılarına iletilen veriler bakımından ilgili sağlayıcının saklama süreleri
          uygulanır. Barındırma sağlayıcılarının tuttuğu teknik kayıtlar, kendi politikaları çerçevesinde
          ve hizmetin güvenliği için makul süreyle saklanabilir.
        </P>
      </Section>

      <Section title="9. Çerezler ve Yerel Depolama">
        <P>
          Hizmet, <strong>reklam veya izleme amaçlı çerez kullanmaz</strong>. Uygulama yalnızca arayüz
          tercihlerinizi (örneğin açık paneller, dock genişliği, son kullanılan ayarlar) hatırlamak için
          tarayıcınızın <strong>yerel depolamasını (localStorage)</strong> kullanır. Bu veriler cihazınızda
          kalır, sunuculara gönderilmez ve istediğiniz zaman tarayıcı ayarlarından temizlenebilir.
        </P>
        <P>
          İleride ürün analitiği eklenirse, zorunlu olmayan takip için ayrıca <strong>açık onayınız</strong>
          alınacak ve onaya kadar bu tür takip gerçekleştirilmeyecektir.
        </P>
      </Section>

      <Section title="10. Veri Güvenliği">
        <P>Verilerinizin güvenliği için aldığımız başlıca teknik tedbirler:</P>
        <Ul>
          <li>Tüm trafik <strong>şifreli bağlantı</strong> (HTTPS/WSS) üzerinden taşınır.</li>
          <li>Yapay zekâ sağlayıcı anahtarları yalnızca sunucu tarafında tutulur; <strong>tarayıcıya hiçbir zaman gönderilmez</strong>.</li>
          <li>İstek sınırlama (rate limiting) ile kötüye kullanım/aşırı yük önlenir.</li>
          <li>Hata mesajlarında teknik ayrıntı/iz kaydı son kullanıcıya sızdırılmaz.</li>
        </Ul>
        <P>
          İnternet üzerinden hiçbir aktarımın veya elektronik saklamanın %100 güvenli olmadığını hatırlatmak
          isteriz; makul tedbirleri almakla birlikte mutlak güvenliği garanti edemeyiz.
        </P>
      </Section>

      <Section title="11. Haklarınız (KVKK m. 11)">
        <P>KVKK uyarınca veri sorumlusuna başvurarak aşağıdaki haklara sahipsiniz:</P>
        <Ul>
          <li>Kişisel verinizin işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>Mevzuattaki şartlar çerçevesinde silinmesini/yok edilmesini isteme,</li>
          <li>Düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>Otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
          <li>Hukuka aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
        </Ul>
        <P>
          Sunucuda kalıcı veri tutmadığımız için talepleriniz büyük ölçüde üçüncü taraf sağlayıcılardaki
          kayıtlara ilişkin olabilir; başvurunuzu yukarıdaki e-posta üzerinden iletebilirsiniz.
        </P>
      </Section>

      <Section title="12. Yapay Zekâ Çıktıları Hakkında">
        <P>
          Yapay zekâ tarafından üretilen planlar, öneriler, yönetmelik/mevzuat bilgileri ve görseller
          <strong> deneyseldir ve hata içerebilir</strong>. Bunlar bilgilendirme amaçlıdır; resmî,
          uygulanabilir veya bağlayıcı kararlar için yetkili bir mimar/mühendis tarafından doğrulanmalıdır.
          Yapay zekâ, sizin adınıza bağlayıcı veya nihai bir karar üretmez. Çıktıların doğruluğu, mevzuata
          uygunluğu ve uygulanabilirliği konusunda nihai sorumluluk kullanıcıdadır.
        </P>
      </Section>

      <Section title="13. Çocukların Gizliliği">
        <P>
          Hizmet, çocuklara yönelik değildir ve bilerek çocuklardan kişisel veri toplamaz. Bir çocuğa ait
          verinin işlendiğini düşünüyorsanız bizimle iletişime geçin.
        </P>
      </Section>

      <Section title="14. Politikadaki Değişiklikler">
        <P>
          Bu Politika zaman zaman güncellenebilir. Değişiklik hâlinde sayfanın üst kısmındaki “son
          güncelleme” tarihi yenilenir; önemli değişiklikleri bu sayfada yayımlarız. Hizmet’i kullanmaya
          devam etmeniz, güncel Politika’yı kabul ettiğiniz anlamına gelir.
        </P>
      </Section>

      <Section title="15. İletişim">
        <P>
          Bu Politika veya kişisel verilerinizin işlenmesi hakkındaki her türlü soru, talep ve başvuru için:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent-text, #a5a5ff)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </P>
      </Section>

      <p className="mt-10 border-t border-[var(--border-hair,#2a2a30)] pt-4 text-xs" style={{ color: 'var(--text-3, #9a9aa2)' }}>
        Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez. Ayrıca bkz.{' '}
        <Link href="/kosullar" className="hover:underline" style={{ color: 'var(--accent-text, #a5a5ff)' }}>
          Kullanım Koşulları
        </Link>
        .
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed" style={{ color: 'var(--text-2, #c4c4ca)' }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
