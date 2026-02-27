import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const promos = [
  {
    id: 1,
    title: "Yuk, pakai Livin' by Mandiri!",
    desc: "Download & daftar sekarang. Gunakan kode referral: MGM7MLZ6LS",
    link: "https://bmri.id/reflivin?af_adset=MGM7MLZ6LS&deep_link_sub1=null&deep_link_sub2=MGM7MLZ6LS",
    gradient: "from-[hsl(210,55%,22%)] to-[hsl(200,60%,35%)]",
    emoji: "📱",
  },
  {
    id: 2,
    title: "Referral Livin' Mandiri",
    desc: "Kode referral: MGM7MLZ6LS • FAQ: bmri.id/livinmgm",
    link: "https://bmri.id/livinmgm",
    gradient: "from-[hsl(160,60%,35%)] to-[hsl(160,50%,45%)]",
    emoji: "🎁",
  },
  {
    id: 3,
    title: "Bank Mandiri Terpercaya",
    desc: "Berizin & diawasi OJK dan Bank Indonesia, peserta penjaminan LPS.",
    link: "https://bmri.id/reflivin?af_adset=MGM7MLZ6LS&deep_link_sub1=null&deep_link_sub2=MGM7MLZ6LS",
    gradient: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]",
    emoji: "🏦",
  },
];

export default function PromoCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % promos.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + promos.length) % promos.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {promos.map((promo) => (
            <a key={promo.id} href={promo.link} target="_blank" rel="noopener noreferrer"
              className={`min-w-full bg-gradient-to-r ${promo.gradient} rounded-2xl p-5 flex flex-col justify-between min-h-[120px] cursor-pointer`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{promo.emoji}</span>
                  <h3 className="text-sm font-bold text-primary-foreground">{promo.title}</h3>
                </div>
                <p className="text-xs text-primary-foreground/80 leading-relaxed">{promo.desc}</p>
              </div>
              <div className="flex items-center gap-1 mt-2 text-primary-foreground/70">
                <span className="text-[10px] font-medium">Selengkapnya</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {promos.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`} />
        ))}
      </div>
    </div>
  );
}
