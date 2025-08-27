export const exportDashboardPDF = (elementId, filename = "dashboard.pdf") => {
    const element = document.getElementById(elementId);
    if (!element || !window.html2pdf) {
        console.error("Không tìm thấy phần tử hoặc html2pdf chưa sẵn sàng.");
        return;
    }

    const opt = {
        margin: 0.5,
        filename,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3, logging: true, dpi: 300, letterRendering: true },
        jsPDF: { unit: "in", format: "a3", orientation: "portrait" },
    };

    window.html2pdf().set(opt).from(element).save();
};
