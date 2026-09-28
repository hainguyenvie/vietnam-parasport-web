"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const fallbackSports = [
  { nameVi: "Cử tạ", slug: "cu-ta", icon: "🏋️‍♂️" },
  { nameVi: "Bơi lội", slug: "boi-loi", icon: "🏊‍♂️" },
  { nameVi: "Điền kinh", slug: "dien-kinh", icon: "🏃‍♂️" },
  { nameVi: "Bóng bàn", slug: "bong-ban", icon: "🏓" },
  { nameVi: "Cầu lông", slug: "cau-long", icon: "🏸" },
  { nameVi: "Bắn cung", slug: "ban-cung", icon: "🏹" },
  { nameVi: "Bóng rổ xe lăn", slug: "bong-ro-xe-lan", icon: "🏀" },
  { nameVi: "Quần vợt xe lăn", slug: "quan-vot-xe-lan", icon: "🎾" },
  { nameVi: "Cờ vua", slug: "co-vua", icon: "♟️" },
  { nameVi: "Cờ tướng", slug: "co-tuong", icon: "🎲" },
  { nameVi: "Judo khiếm thị", slug: "judo-khiem-thi", icon: "🥋" },
];

interface SportItem {
  nameVi?: string;
  nameEn?: string;
  name?: string;
  slug: string;
  icon?: string;
}

interface SportsCarouselProps {
  sports?: SportItem[];
  title?: string;
  showArrows?: boolean;
}

export default function SportsCarousel({ sports, title, showArrows = false }: SportsCarouselProps) {
  const list = (sports && sports.length > 0 ? sports : fallbackSports).map((s: any) => ({
    name: s.nameVi || s.nameEn || s.name || "",
    slug: s.slug,
    icon: s.icon || "🏅",
  }));
  const doubled = [...list, ...list];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // Resume auto-scroll after 5s of no manual interaction
  useEffect(() => {
    if (isInteracting) {
      const timer = setTimeout(() => setIsInteracting(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInteracting]);

  // Auto scroll logic with infinite loop
  useEffect(() => {
    if (isHovered || isInteracting) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const halfWidth = scrollWidth / 2;

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          scrollRef.current.scrollTo({ left: scrollLeft - halfWidth, behavior: 'instant' as ScrollBehavior });
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
          }, 50);
        } else {
          scrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, isInteracting]);

  const scroll = (direction: 'left' | 'right') => {
    setIsInteracting(true);
    if (scrollRef.current) {
      const scrollAmount = 320;
      const { scrollLeft, scrollWidth } = scrollRef.current;
      const halfWidth = scrollWidth / 2;

      if (direction === 'right' && scrollLeft + scrollRef.current.clientWidth >= scrollWidth - 20) {
        scrollRef.current.scrollTo({ left: scrollLeft - halfWidth, behavior: 'instant' as ScrollBehavior });
        setTimeout(() => scrollRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' }), 50);
        return;
      }

      if (direction === 'left' && scrollLeft <= 20) {
        scrollRef.current.scrollTo({ left: scrollLeft + halfWidth, behavior: 'instant' as ScrollBehavior });
        setTimeout(() => scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' }), 50);
        return;
      }

      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsInteracting(true)}
      onClick={() => setIsInteracting(true)}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title || "Xem tin tức theo bộ môn"}
        </h2>

        {showArrows && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => { e.preventDefault(); scroll('left'); }}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition"
              aria-label="Cuộn trái"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); scroll('right'); }}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition"
              aria-label="Cuộn phải"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
      >
        {doubled.map((sport, index) => (
          <Link
            key={`${sport.slug}-${index}`}
            href={`/sports/${sport.slug}`}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-950/40 text-center hover:text-blue-600 dark:hover:text-blue-400 transition hover:-translate-y-0.5 min-w-[120px] sm:min-w-[140px] flex-shrink-0 snap-start"
          >
            <span className="text-3xl mb-2">{sport.icon}</span>
            <span className="text-xs font-bold truncate w-full px-2">{sport.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
