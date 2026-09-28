"use client";

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: string;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const prevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const nextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

  return (
    <div className="flex flex-col w-full h-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative rounded-[1.8rem]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button onClick={zoomOut} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm text-slate-600 dark:text-slate-300" title="Thu nhỏ"><ZoomOut size={16} /></button>
          <span className="text-xs font-bold w-12 text-center text-slate-700 dark:text-slate-200">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm text-slate-600 dark:text-slate-300" title="Phóng to"><ZoomIn size={16} /></button>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={prevPage} disabled={pageNumber <= 1} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full disabled:opacity-30 transition text-slate-700 dark:text-slate-300"><ChevronLeft size={16} /></button>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Trang {pageNumber} <span className="text-slate-400 font-normal">/ {numPages || '-'}</span></span>
          <button onClick={nextPage} disabled={pageNumber >= (numPages || 1)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full disabled:opacity-30 transition text-slate-700 dark:text-slate-300"><ChevronRight size={16} /></button>
        </div>
        
        <div className="flex items-center gap-2">
           <a href={file} target="_blank" rel="noreferrer" download className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition font-bold text-xs" title="Tải xuống tài liệu">
             <Download size={16} /> Tải xuống
           </a>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950/50 p-4 md:p-8 flex justify-center custom-scrollbar">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-full space-y-4 pt-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium animate-pulse">Đang tải tài liệu PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full space-y-4 pt-20">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-center max-w-sm">
                <p className="font-bold mb-2">Lỗi tải tài liệu</p>
                <p className="text-sm">Không thể tải file PDF. Link file có thể đã hỏng hoặc bị chặn quyền truy cập.</p>
              </div>
            </div>
          }
          className="flex flex-col items-center pb-20"
        >
          <div className="shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-out bg-white">
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              renderAnnotationLayer={true}
              renderTextLayer={true}
              className="bg-white overflow-hidden"
            />
          </div>
        </Document>
      </div>
    </div>
  );
}
