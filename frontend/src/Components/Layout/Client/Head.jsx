import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";

function MyHead() {
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    async function loadScriptsSequentially() {
      try {
        // Load jQuery đầu tiên
        await loadScript("https://code.jquery.com/jquery-3.6.0.min.js");

        // Load các thư viện plugin theo thứ tự
        const scripts = [
          "/asset/lib/wow/wow.min.js",
          "/asset/lib/easing/easing.min.js",
          "/asset/lib/waypoints/waypoints.min.js",
          "/asset/lib/counterup/counterup.min.js",
          "/asset/lib/lightbox/js/lightbox.min.js",
          "/asset/lib/owlcarousel/owl.carousel.min.js",
          "/asset/js/main.js",
        ];

        for (const src of scripts) {
          await loadScript(src);
        }

        // Sau khi load xong tất cả script, khởi tạo owl-carousel
        if (window.$ && typeof window.$.fn.owlCarousel === "function") {
          window.$(".owl-carousel").owlCarousel({
            loop: true,
            margin: 10,
            nav: true,
            dots: true,
            autoplay: true,
            autoplayTimeout: 3000,
            responsive: {
              0: { items: 1 },
              600: { items: 2 },
              1000: { items: 3 },
            },
          });
        }
      } catch (error) {
        console.error("Failed to load script", error);
      }
    }

    loadScriptsSequentially();
  }, []);

  return (
    <Helmet>
      <meta charSet="utf-8" />
      <title>CaterServ - Catering Services Website Template</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="keywords" content="" />
      <meta name="description" content="" />

      {/* Google Web Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Playball&display=swap"
        rel="stylesheet"
      />

      {/* Icon Font Stylesheet */}
      <link
        rel="stylesheet"
        href="https://use.fontawesome.com/releases/v5.15.4/css/all.css"
      />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      {/* Libraries Stylesheet */}
      <link href="/asset/lib/animate/animate.min.css" rel="stylesheet" />
      <link href="/asset/lib/lightbox/css/lightbox.min.css" rel="stylesheet" />
      <link href="/asset/lib/owlcarousel/owl.carousel.min.css" rel="stylesheet" />

      {/* Customized Bootstrap Stylesheet */}
      <link href="/asset/css/bootstrap.min.css" rel="stylesheet" />

      {/* Template Stylesheet */}
      <link href="/asset/css/style.css" rel="stylesheet" />
    </Helmet>
  );
}

export default MyHead;
