import { useTranslation } from "../i18n/useTranslation";

export default function PlatesLogo() {
  const { t } = useTranslation();

  return (
    <div className="relative inline-flex items-center bg-white border-[5px] border-[#1a1a1a] rounded-2xl px-5 py-3">
      <span className="absolute top-[7px] left-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
      <span className="absolute top-[7px] right-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
      <span className="absolute bottom-[7px] left-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
      <span className="absolute bottom-[7px] right-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
      <span
        className="text-[32px] font-black tracking-[8px] text-[#1a1a1a]"
        style={{ fontFamily: "system-ui, monospace" }}
      >
        {t("app.title")}
      </span>
    </div>
  );
}