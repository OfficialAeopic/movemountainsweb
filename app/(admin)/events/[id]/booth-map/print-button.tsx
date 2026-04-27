"use client";

// PROMPT 17 - Trigger the browser print dialog. Uses CSS @media print on the page to lay out for paper.

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
    >
      Print
    </Button>
  );
}
