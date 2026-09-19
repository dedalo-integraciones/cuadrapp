import React from 'react';
import { PriceKiloItem } from '../types';
import { WHATSAPP_PHONE_DISPLAY, WHATSAPP_PHONE_NUMBER, formatPriceARS } from '../utils/csvParser';
import { WHATSAPP_MESSAGE_CONSULTATION } from '../config';
import { Plus, Motorbike } from 'lucide-react';

interface PricesSectionProps {
  milaPrices: PriceKiloItem[];
  rollitoPrices: PriceKiloItem[];
  onAddPriceItem: (item: PriceKiloItem, tipo: 'kilo_mila' | 'kilo_rollito') => void;
}

export const PricesSection: React.FC<PricesSectionProps> = ({
  milaPrices,
  rollitoPrices,
  onAddPriceItem,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* ============================================================== */}
      {/* WHATSAPP CONTACT SECTION */}
      {/* ============================================================== */}
      <div className="relative pt-3 pb-1 text-center">
        {/* Big WhatsApp Number Button */}
        <a
          href={`https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(
            WHATSAPP_MESSAGE_CONSULTATION
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 group transition-transform active:scale-95"
        >
          {/* WhatsApp Logo SVG */}
          <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <svg
              className="w-7 h-7 text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </div>
          <span className="font-extrabold text-3xl sm:text-4xl text-[#19234d] tracking-normal font-poppins">
            {WHATSAPP_PHONE_DISPLAY}
          </span>
        </a>
      </div>

      {/* ============================================================== */}
      {/* SECTION PRECIOS MILANESAS */}
      {/* ============================================================== */}
      <div className="relative pt-3">
        {/* Title Box with double/dashed pink border */}
        <div className="rounded-3xl border-2 border-dashed border-[#e84393] bg-white py-2 px-4 text-center shadow-xs">
          <h3 className="font-caveat text-3xl sm:text-4xl font-extrabold text-[#e84393] tracking-tight">
            Milanesas de Pollo
          </h3>
        </div>

        {/* Teal Header Badge */}
        <div className="flex justify-center -mb-3 mt-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#00b6b6] text-white font-extrabold text-sm tracking-widest uppercase px-6 py-1 rounded-full shadow-xs">
            <span className="text-xs">⫸</span>
            <span>PRECIOS</span>
            <span className="text-xs">⫷</span>
          </div>
        </div>

        {/* Pricing Card with teal border */}
        <div className="rounded-3xl border-2 border-[#00b6b6] bg-white pt-6 pb-3 px-3 shadow-xs">
          <div className="space-y-3">
            {/* Row 1: 1 KG */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 rounded-2xl transition-all">
              {/* Left Circle Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#e84393] flex flex-col items-center justify-center text-white shadow-xs flex-shrink-0">
                <span className="font-black text-xl leading-none">1</span>
                <span className="font-extrabold text-[10px] leading-tight tracking-tight">KG</span>
              </div>

              {/* Middle: Text + Dotted Line */}
              <div className="flex-1 flex items-center min-w-0 px-1">
                <span className="font-black text-[#19234d] text-[13px] tracking-wide uppercase whitespace-nowrap mr-1">
                  POR KG
                </span>
                <div className="flex-1 dotted-leader h-3 mx-1"></div>
              </div>

              {/* Right Pill Price + Add Button */}
              <div className="flex items-center gap-1.5">
                <div className="bg-[#e84393] text-white rounded-full px-3.5 py-1 flex flex-col items-center min-w-[100px] shadow-xs">
                  <span className="font-black text-base sm:text-lg leading-tight">
                    {formatPriceARS(milaPrices[0]?.precio || 6950)}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider opacity-90 -mt-0.5">
                    EL KG
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const item = milaPrices.find((p) => p.detalle_2.includes('1')) || milaPrices[0];
                    if (item) onAddPriceItem(item, 'kilo_mila');
                  }}
                  aria-label="Agregar 1 KG de Milanesas al carrito"
                  className="w-8 h-8 rounded-full bg-pink-100 text-[#e84393] flex items-center justify-center hover:bg-[#e84393] hover:text-white active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Row 2: MÁS DE 2 KG */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 rounded-2xl transition-all">
              {/* Left Circle Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#00b6b6] flex flex-col items-center justify-center text-white shadow-xs flex-shrink-0">
                <span className="font-extrabold text-[8px] leading-none uppercase tracking-tighter">MÁS DE</span>
                <span className="font-black text-xl leading-none">2</span>
                <span className="font-extrabold text-[9px] leading-tight tracking-tight">KG</span>
              </div>

              {/* Middle: Text + Dotted Line */}
              <div className="flex-1 flex items-center min-w-0 px-1">
                <span className="font-black text-[#19234d] text-[13px] tracking-wide uppercase whitespace-nowrap mr-1">
                  POR KG
                </span>
                <div className="flex-1 dotted-leader h-3 mx-1"></div>
              </div>

              {/* Right Pill Price + Add Button */}
              <div className="flex items-center gap-1.5">
                <div className="bg-[#00b6b6] text-white rounded-full px-3.5 py-1 flex flex-col items-center min-w-[100px] shadow-xs">
                  <span className="font-black text-base sm:text-lg leading-tight">
                    {formatPriceARS(milaPrices[1]?.precio || 6450)}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider opacity-90 -mt-0.5">
                    EL KG
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const item = milaPrices.find((p) => p.detalle_2.includes('2')) || milaPrices[1];
                    if (item) onAddPriceItem(item, 'kilo_mila');
                  }}
                  aria-label="Agregar más de 2 KG de Milanesas al carrito"
                  className="w-8 h-8 rounded-full bg-teal-100 text-[#00b6b6] flex items-center justify-center hover:bg-[#00b6b6] hover:text-white active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Row 3: MÁS DE 3 KG */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 rounded-2xl transition-all">
              {/* Left Circle Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#7c5cbf] flex flex-col items-center justify-center text-white shadow-xs flex-shrink-0">
                <span className="font-extrabold text-[8px] leading-none uppercase tracking-tighter">MÁS DE</span>
                <span className="font-black text-xl leading-none">3</span>
                <span className="font-extrabold text-[9px] leading-tight tracking-tight">KG</span>
              </div>

              {/* Middle: Text + Dotted Line */}
              <div className="flex-1 flex items-center min-w-0 px-1">
                <span className="font-black text-[#19234d] text-[13px] tracking-wide uppercase whitespace-nowrap mr-1">
                  POR KG
                </span>
                <div className="flex-1 dotted-leader h-3 mx-1"></div>
              </div>

              {/* Right Pill Price + Add Button */}
              <div className="flex items-center gap-1.5">
                <div className="bg-[#7c5cbf] text-white rounded-full px-3.5 py-1 flex flex-col items-center min-w-[100px] shadow-xs">
                  <span className="font-black text-base sm:text-lg leading-tight">
                    {formatPriceARS(milaPrices[2]?.precio || 6000)}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider opacity-90 -mt-0.5">
                    EL KG
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const item = milaPrices.find((p) => p.detalle_2.includes('3')) || milaPrices[2];
                    if (item) onAddPriceItem(item, 'kilo_mila');
                  }}
                  aria-label="Agregar más de 3 KG de Milanesas al carrito"
                  className="w-8 h-8 rounded-full bg-purple-100 text-[#7c5cbf] flex items-center justify-center hover:bg-[#7c5cbf] hover:text-white active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Note Banner */}
          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[#e84393]">
            <Motorbike className="w-5 h-5 flex-shrink-0" />
            <span className="text-center font-black text-xs sm:text-sm tracking-wide font-poppins leading-tight">
              Consulte el área de nuestro Delivery
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION PRECIOS ROLLITOS */}
      {/* ============================================================== */}
      <div className="relative pt-3">
        {/* Title Box with double/dashed purple border */}
        <div className="rounded-3xl border-2 border-dashed border-[#7c5cbf] bg-white py-2 px-4 text-center shadow-xs">
          <h3 className="font-caveat text-3xl sm:text-4xl font-extrabold text-[#7c5cbf] tracking-tight">
            Rollitos de Pollo, jamón y queso
          </h3>
        </div>

        {/* Teal Header Badge */}
        <div className="flex justify-center -mb-3 mt-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#00b6b6] text-white font-extrabold text-sm tracking-widest uppercase px-6 py-1 rounded-full shadow-xs">
            <span className="text-xs">⫸</span>
            <span>PRECIOS</span>
            <span className="text-xs">⫷</span>
          </div>
        </div>

        {/* Pricing Card with teal border */}
        <div className="rounded-3xl border-2 border-[#00b6b6] bg-white pt-6 pb-3 px-3 shadow-xs">
          <div className="space-y-3">
            {/* Row 1: 1 KG */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 rounded-2xl transition-all">
              {/* Left Circle Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#5fbf8b] flex flex-col items-center justify-center text-white shadow-xs flex-shrink-0">
                <span className="font-black text-xl leading-none">1</span>
                <span className="font-extrabold text-[10px] leading-tight tracking-tight">KG</span>
              </div>

              {/* Middle: Text + Dotted Line */}
              <div className="flex-1 flex items-center min-w-0 px-1">
                <span className="font-black text-[#19234d] text-[13px] tracking-wide uppercase whitespace-nowrap mr-1">
                  POR KG
                </span>
                <div className="flex-1 dotted-leader h-3 mx-1"></div>
              </div>

              {/* Right Pill Price + Add Button */}
              <div className="flex items-center gap-1.5">
                <div className="bg-[#5fbf8b] text-white rounded-full px-3.5 py-1 flex flex-col items-center min-w-[100px] shadow-xs">
                  <span className="font-black text-base sm:text-lg leading-tight">
                    {formatPriceARS(rollitoPrices[0]?.precio || 9000)}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider opacity-90 -mt-0.5">
                    EL KG
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const item = rollitoPrices.find((p) => p.detalle_2.includes('1')) || rollitoPrices[0];
                    if (item) onAddPriceItem(item, 'kilo_rollito');
                  }}
                  aria-label="Agregar 1 KG de Rollitos al carrito"
                  className="w-8 h-8 rounded-full bg-emerald-100 text-[#5fbf8b] flex items-center justify-center hover:bg-[#5fbf8b] hover:text-white active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Row 2: 2 KG */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 rounded-2xl transition-all">
              {/* Left Circle Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#e84393] flex flex-col items-center justify-center text-white shadow-xs flex-shrink-0">
                <span className="font-black text-xl leading-none">2</span>
                <span className="font-extrabold text-[10px] leading-tight tracking-tight">KG</span>
              </div>

              {/* Middle: Text + Dotted Line */}
              <div className="flex-1 flex items-center min-w-0 px-1">
                <span className="font-black text-[#19234d] text-[13px] tracking-wide uppercase whitespace-nowrap mr-1">
                  POR KG
                </span>
                <div className="flex-1 dotted-leader h-3 mx-1"></div>
              </div>

              {/* Right Pill Price + Add Button */}
              <div className="flex items-center gap-1.5">
                <div className="bg-[#e84393] text-white rounded-full px-3.5 py-1 flex flex-col items-center min-w-[100px] shadow-xs">
                  <span className="font-black text-base sm:text-lg leading-tight">
                    {formatPriceARS(rollitoPrices[1]?.precio || 8000)}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider opacity-90 -mt-0.5">
                    EL KG
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const item = rollitoPrices.find((p) => p.detalle_2.includes('2')) || rollitoPrices[1];
                    if (item) onAddPriceItem(item, 'kilo_rollito');
                  }}
                  aria-label="Agregar 2 KG de Rollitos al carrito"
                  className="w-8 h-8 rounded-full bg-pink-100 text-[#e84393] flex items-center justify-center hover:bg-[#e84393] hover:text-white active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Row 3: 3+ KG */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 rounded-2xl transition-all">
              {/* Left Circle Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#7c5cbf] flex flex-col items-center justify-center text-white shadow-xs flex-shrink-0">
                <span className="font-black text-lg leading-none">3+</span>
                <span className="font-extrabold text-[10px] leading-tight tracking-tight">KG</span>
              </div>

              {/* Middle: Text + Dotted Line */}
              <div className="flex-1 flex items-center min-w-0 px-1">
                <span className="font-black text-[#19234d] text-[13px] tracking-wide uppercase whitespace-nowrap mr-1">
                  POR KG
                </span>
                <div className="flex-1 dotted-leader h-3 mx-1"></div>
              </div>

              {/* Right Pill Price + Add Button */}
              <div className="flex items-center gap-1.5">
                <div className="bg-[#7c5cbf] text-white rounded-full px-3.5 py-1 flex flex-col items-center min-w-[100px] shadow-xs">
                  <span className="font-black text-base sm:text-lg leading-tight">
                    {formatPriceARS(rollitoPrices[2]?.precio || 7500)}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider opacity-90 -mt-0.5">
                    EL KG
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const item = rollitoPrices.find((p) => p.detalle_2.includes('3')) || rollitoPrices[2];
                    if (item) onAddPriceItem(item, 'kilo_rollito');
                  }}
                  aria-label="Agregar 3 o más KG de Rollitos al carrito"
                  className="w-8 h-8 rounded-full bg-purple-100 text-[#7c5cbf] flex items-center justify-center hover:bg-[#7c5cbf] hover:text-white active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          {/* Special Note Pill */}
          <div className="mt-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#5fbf8b] bg-[#f0fdf4] text-[#1e293b] shadow-xs">
              <span className="text-[#5fbf8b]">🌿</span>
              <span className="text-[13px] italic font-semibold">Entran entre 7 u 8 rollitos</span>
              <span className="text-[#5fbf8b]">🌿</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner Dark Teal */}
        <div className="mt-3 rounded-full bg-[#009b9b] py-2 px-4 flex items-center justify-center gap-2 text-white shadow-sm">
          <Motorbike className="w-5 h-5 flex-shrink-0 text-white" />
          <span className="font-black text-xs sm:text-sm tracking-wide font-poppins text-center">
            Consulte el área de nuestro Delivery
          </span>
        </div>
      </div>
    </div>
  );
};

export default PricesSection;
