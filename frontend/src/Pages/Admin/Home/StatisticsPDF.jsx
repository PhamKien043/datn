import "./StatisticsPDF.css";

export const exportDashboardPDF = (elementId, filename = "dashboard.pdf") => {
  const element = document.getElementById(elementId);
  if (!element || !window.html2pdf) {
    console.error("Không tìm thấy phần tử hoặc html2pdf chưa sẵn sàng.");
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }, // ngang cho đẹp
    pagebreak: { mode: ["avoid", "css", "legacy"] },
  };

  window.html2pdf().set(opt).from(element).save();
};
