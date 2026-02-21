# Namaz CLI 🌙

Terminal ekranından, şık bir tasarımla günlük ezan vakitlerini ve İftar/Sahur geri sayımını takip edebileceğiniz bir Node.js CLI uygulamasıdır.

Pır pır etmeyen (flicker-free) akıcı animasyonu, büyük saat fontları ve ASCII sanatı ile terminalinize estetik bir dokunuş katar. Özellikle Ramazan ayında "Sahura Kalan" ve "İftara Kalan" sürelerini otomatik olarak hesaplar ve gösterir.

## ✨ Özellikler

- **İlk Kurulum Sihirbazı:** İlk çalıştırıldığında bulunduğunuz ülke ve şehri sorar ve kaydeder (değiştirmek için `--reset` bayrağını kullanabilirsiniz).
- **Canlı Geri Sayım:** Sahura, iftara (Ramazan'da) veya bir sonraki vakte kalan süreyi saniye saniye akıcı bir şekilde gösterir.
- **Diyanet Uyumlu Veri:** Aladhan API üzerinden Diyanet İşleri Başkanlığı'nın hesaplama yöntemini (Method 13) kullanır.
- **Ramazan Modu:** Hicri takvime göre Ramazan ayında (9. ay) sahur ve iftar etiketlerine tam uyumlu çalışır. Gece saatlerinde otomatik olarak ertesi günün sahur vaktini gösterir.
- **Font Değiştirme:** Uygulama çalışırken **F** tuşuna basarak 19 farklı ASCII font stili arasında geçiş yapabilirsiniz.
- **Şık ve Minimalist Tasarım:**
  - `figlet` ve `gradient-string` ile yazılmış büyük renkli fontlar
  - `cli-table3` ile düzenli ve hizalanmış vakit çizelgesi tablosu
  - `log-update` ile ekran titremesi olmayan pürüzsüz animasyonlar
  - Renkli gradyan geçişli ASCII cami figürü
- **Hicri Takvim Desteği:** Bulunduğunuz güne ait Türkçe hicri ay ve gün bilgisi gösterir.

![Ekran Görüntüsü](screenshot21022026.png)

## 📦 Kurulum

### 1. Projeyi İndirin
```bash
git clone https://github.com/tamert/namaz-cli.git
cd namaz-cli
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Global Kurulum (Opsiyonel)
Terminalinizde her yerden `namaz` komutuyla çalıştırabilmek için:
```bash
npm link
```

## 🚀 Kullanım

### Temel Kullanım
```bash
# Global kurulum yaptıysanız
namaz

# Veya direkt olarak
node index.js
```

### Ayarları Sıfırlama
Yanlış ülke/şehir girdiyseniz veya konumunuzu değiştirmek istiyorsanız:
```bash
namaz --reset
```

### Klavye Kısayolları
- **F tuşu:** Font stilini değiştir (19 farklı font arasında geçiş)
- **Ctrl+C:** Uygulamadan çık

## 🛠️ Teknolojiler

Bu proje aşağıdaki harika kütüphaneler kullanılarak geliştirilmiştir:

- [axios](https://www.npmjs.com/package/axios) - API istekleri
- [chalk](https://www.npmjs.com/package/chalk) - Terminal renklendirme
- [figlet](https://www.npmjs.com/package/figlet) - ASCII art fontları
- [gradient-string](https://www.npmjs.com/package/gradient-string) - Gradyan renkler
- [cli-table3](https://www.npmjs.com/package/cli-table3) - Terminal tabloları
- [date-fns](https://www.npmjs.com/package/date-fns) - Tarih/saat hesaplamaları
- [log-update](https://www.npmjs.com/package/log-update) - Titremesiz terminal güncellemeleri
- [conf](https://www.npmjs.com/package/conf) - Kullanıcı ayarları yönetimi
- [prompts](https://www.npmjs.com/package/prompts) - İnteraktif komut satırı promptları

## 📝 Lisans

ISC

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull request göndermekten çekinmeyin.

---

**Not:** Ezan vakitleri [Aladhan API](https://aladhan.com/prayer-times-api) üzerinden Diyanet İşleri Başkanlığı hesaplama yöntemiyle alınmaktadır.
