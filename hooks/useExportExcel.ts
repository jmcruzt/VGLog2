'use client';
import * as XLSX from 'xlsx';

export function useExportExcel() {
  const exportToExcel = <T extends Record<string, unknown>>(data: T[], filename: string) => {
    if (data.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };
  return { exportToExcel };
}
