/**
 * @file src/app/monitoring/layout.tsx
 * @description 모니터링 레이아웃 - LineFilterProvider 감싸기 + 강제 라인 선택
 *
 * 초보자 가이드:
 * 1. **LineFilterProvider**: 하위 모든 페이지에서 선택 라인 공유
 * 2. **강제 모달**: localStorage에 저장된 라인이 없으면 모달 자동 팝업
 */

"use client";

import { LineFilterProvider, useLineFilter } from "./contexts/LineFilterContext";
import LineSelectModal from "./components/LineSelectModal";
import { useLocale } from "@/i18n";

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
      <LineFilterGate>{children}</LineFilterGate>
    </LineFilterProvider>
  );
}
