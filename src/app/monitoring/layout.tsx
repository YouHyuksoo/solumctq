/**
 * @file src/app/monitoring/layout.tsx
 * @description 모니터링 레이아웃 - LineFilterProvider + 강제 라인 선택 + 전체화면 프롬프트
 *
 * 초보자 가이드:
 * 1. **LineFilterProvider**: 하위 모든 페이지에서 선택 라인 공유
 * 2. **강제 모달**: localStorage에 저장된 라인이 없으면 모달 자동 팝업
 * 3. **전체화면**: ?fullscreen=1 파라미터 시 전체화면 전환 배너 표시
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LineFilterProvider, useLineFilter } from "./contexts/LineFilterContext";
import LineSelectModal from "./components/LineSelectModal";
import { useLocale } from "@/i18n";

const FS_PREF_KEY = "ctq-fullscreen-preferred";

/**
 * 전체화면 자동 진입:
 * - ?fullscreen=1 → 배너 표시
 * - localStorage에 선호 저장됨 → 첫 클릭/터치에 자동 진입 (배너 없이)
 * - 헤더 토글로 ON/OFF → 선호 저장/삭제
 */
function FullscreenPrompt() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (document.fullscreenElement) return;

    /* ?fullscreen=1 파라미터 → 배너 표시 */
    if (searchParams.get("fullscreen") === "1") {
      setShow(true);
      return;
    }

    /* localStorage 선호 → 첫 클릭에 자동 진입 */
    const preferred = localStorage.getItem(FS_PREF_KEY) === "1";
    if (!preferred) return;

    const enterOnInteraction = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      document.removeEventListener("click", enterOnInteraction);
      document.removeEventListener("touchstart", enterOnInteraction);
    };
    document.addEventListener("click", enterOnInteraction, { once: true });
    document.addEventListener("touchstart", enterOnInteraction, { once: true });
    return () => {
      document.removeEventListener("click", enterOnInteraction);
      document.removeEventListener("touchstart", enterOnInteraction);
    };
  }, [searchParams]);

  if (!show) return null;

  const enter = () => {
    document.documentElement.requestFullscreen();
    localStorage.setItem(FS_PREF_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 flex items-center justify-center gap-4 text-sm">
      <span>전체화면으로 전환하시겠습니까?</span>
      <button
        onClick={enter}
        className="px-3 py-1 bg-white text-blue-700 font-bold rounded hover:bg-blue-50 transition-colors"
      >
        전체화면
      </button>
      <button
        onClick={() => setShow(false)}
        className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800 transition-colors"
      >
        닫기
      </button>
    </div>
  );
}

function LineFilterGate({ children }: { children: React.ReactNode }) {
  const { selectedLines, setSelectedLines, isInitialized, hasSelection } =
    useLineFilter();
  const { t } = useLocale();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        {t("common.loading") as string}
      </div>
    );
  }

  return (
    <>
      {!hasSelection && (
        <LineSelectModal
          open={true}
          forced={true}
          initialSelected={selectedLines}
          onApply={(lines) => setSelectedLines(lines)}
          onClose={() => {}}
        />
      )}
      {hasSelection && children}
    </>
  );
}

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LineFilterProvider>
      <FullscreenPrompt />
      <LineFilterGate>{children}</LineFilterGate>
    </LineFilterProvider>
  );
}
