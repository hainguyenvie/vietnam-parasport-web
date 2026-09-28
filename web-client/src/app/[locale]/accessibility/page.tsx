export default function AccessibilityPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl min-h-[60vh]" id="main-content">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">
        Accessibility Statement / Tuyên bố về Khả năng Tiếp cận
      </h1>

      <section className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Cam kết của chúng tôi</h2>
          <p>
            Vietnam ParaSports cam kết đảm bảo khả năng tiếp cận kỹ thuật số cho người khuyết tật.
            Chúng tôi liên tục cải thiện trải nghiệm người dùng cho tất cả mọi người và áp dụng các
            tiêu chuẩn tiếp cận phù hợp.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Tiêu chuẩn tuân thủ</h2>
          <p>Nền tảng này tuân thủ Nguyên tắc Tiếp cận Nội dung Web (WCAG) 2.1 cấp độ AA, bao gồm:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Hỗ trợ điều hướng bằng bàn phím đầy đủ</li>
            <li>Tỷ lệ tương phản màu sắc đáp ứng tiêu chuẩn WCAG</li>
            <li>Semantic HTML với ARIA landmarks</li>
            <li>Văn bản thay thế cho hình ảnh</li>
            <li>Phụ đề cho nội dung video</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Tính năng hỗ trợ</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Chế độ tương phản cao:</strong> Tăng độ tương phản cho người khiếm thị</li>
            <li><strong>Phông chữ Dyslexia:</strong> OpenDyslexic cho người khó đọc</li>
            <li><strong>Điều chỉnh cỡ chữ:</strong> Tùy chỉnh kích thước văn bản</li>
            <li><strong>Đọc văn bản thành giọng nói:</strong> Text-to-Speech cho bài viết</li>
            <li><strong>Điều hướng bàn phím:</strong> Hỗ trợ Tab, Enter, Escape</li>
            <li><strong>Chế độ đơn sắc:</strong> Loại bỏ màu sắc gây nhiễu</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Phản hồi</h2>
          <p>
            Chúng tôi hoan nghênh phản hồi về khả năng tiếp cận của nền tảng.
            Vui lòng liên hệ <a href="mailto:support@paralympic.vn" className="text-blue-600 underline">support@paralympic.vn</a> nếu bạn gặp bất kỳ rào cản nào.
          </p>
        </div>

        <p className="text-sm text-slate-400 pt-4">
          Cập nhật lần cuối: Tháng 6, 2026
        </p>
      </section>
    </main>
  );
}
