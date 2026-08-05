// vite.config.js
import { defineConfig } from "file:///C:/Users/HP%20845%20G7/OneDrive/Desktop/Insights_GNS/GNS%20Insights/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/HP%20845%20G7/OneDrive/Desktop/Insights_GNS/GNS%20Insights/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/HP%20845%20G7/OneDrive/Desktop/Insights_GNS/GNS%20Insights/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    watch: {
      ignored: ["**/node_modules_bak_push/**", "**/dist/**", "**/.git/**"]
    },
    proxy: {
      // Proxy API requests while bypassing static public assets (.png, .jpg, etc.)
      "/auth": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        bypass(req) {
          if (req.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
            return req.url;
          }
        }
      },
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/tasks": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/sidebar": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/platform": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false
  },
  build: {
    // Faster minification; esbuild is default in Vite 5 – keep explicit for clarity
    minify: "esbuild",
    // Smaller initial load: split heavy vendors so they cache and load in parallel
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) return "recharts";
            if (id.includes("react-dom") || id.includes("react-router")) return "react-vendor";
            if (id.includes("react")) return "react-vendor";
            if (id.includes("i18next") || id.includes("i18n")) return "i18n";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("xlsx") || id.includes("jspdf") || id.includes("html2canvas"))
              return "export-libs";
            if (id.includes("axios")) return "axios";
          }
        }
      }
    },
    chunkSizeWarningLimit: 900
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUCA4NDUgRzdcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxJbnNpZ2h0c19HTlNcXFxcR05TIEluc2lnaHRzXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUCA4NDUgRzdcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxJbnNpZ2h0c19HTlNcXFxcR05TIEluc2lnaHRzXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9IUCUyMDg0NSUyMEc3L09uZURyaXZlL0Rlc2t0b3AvSW5zaWdodHNfR05TL0dOUyUyMEluc2lnaHRzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiMTI3LjAuMC4xXCIsXHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICBpZ25vcmVkOiBbXCIqKi9ub2RlX21vZHVsZXNfYmFrX3B1c2gvKipcIiwgXCIqKi9kaXN0LyoqXCIsIFwiKiovLmdpdC8qKlwiXSxcclxuICAgIH0sXHJcbiAgICBwcm94eToge1xyXG4gICAgICAvLyBQcm94eSBBUEkgcmVxdWVzdHMgd2hpbGUgYnlwYXNzaW5nIHN0YXRpYyBwdWJsaWMgYXNzZXRzICgucG5nLCAuanBnLCBldGMuKVxyXG4gICAgICBcIi9hdXRoXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIGJ5cGFzcyhyZXEpIHtcclxuICAgICAgICAgIGlmIChyZXEudXJsLm1hdGNoKC9cXC4ocG5nfGpwZ3xqcGVnfGdpZnxzdmd8d2VicHxpY28pJC9pKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVxLnVybDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIi9hcGlcIjogeyB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxyXG4gICAgICBcIi90YXNrc1wiOiB7IHRhcmdldDogXCJodHRwOi8vMTI3LjAuMC4xOjgwMDBcIiwgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXHJcbiAgICAgIFwiL3NpZGViYXJcIjogeyB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxyXG4gICAgICBcIi9wbGF0Zm9ybVwiOiB7IHRhcmdldDogXCJodHRwOi8vMTI3LjAuMC4xOjgwMDBcIiwgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXHJcbiAgICAgIFwiL2hlYWx0aFwiOiB7IHRhcmdldDogXCJodHRwOi8vMTI3LjAuMC4xOjgwMDBcIiwgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgdGVzdDoge1xyXG4gICAgZW52aXJvbm1lbnQ6IFwianNkb21cIixcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBzZXR1cEZpbGVzOiBcIi4vc3JjL3Rlc3Qvc2V0dXAuanNcIixcclxuICAgIGNzczogZmFsc2UsXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gRmFzdGVyIG1pbmlmaWNhdGlvbjsgZXNidWlsZCBpcyBkZWZhdWx0IGluIFZpdGUgNSBcdTIwMTMga2VlcCBleHBsaWNpdCBmb3IgY2xhcml0eVxyXG4gICAgbWluaWZ5OiBcImVzYnVpbGRcIixcclxuICAgIC8vIFNtYWxsZXIgaW5pdGlhbCBsb2FkOiBzcGxpdCBoZWF2eSB2ZW5kb3JzIHNvIHRoZXkgY2FjaGUgYW5kIGxvYWQgaW4gcGFyYWxsZWxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIikpIHtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicmVjaGFydHNcIikpIHJldHVybiBcInJlY2hhcnRzXCI7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0LWRvbVwiKSB8fCBpZC5pbmNsdWRlcyhcInJlYWN0LXJvdXRlclwiKSkgcmV0dXJuIFwicmVhY3QtdmVuZG9yXCI7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0XCIpKSByZXR1cm4gXCJyZWFjdC12ZW5kb3JcIjtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiaTE4bmV4dFwiKSB8fCBpZC5pbmNsdWRlcyhcImkxOG5cIikpIHJldHVybiBcImkxOG5cIjtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibHVjaWRlLXJlYWN0XCIpKSByZXR1cm4gXCJpY29uc1wiO1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJ4bHN4XCIpIHx8IGlkLmluY2x1ZGVzKFwianNwZGZcIikgfHwgaWQuaW5jbHVkZXMoXCJodG1sMmNhbnZhc1wiKSlcclxuICAgICAgICAgICAgICByZXR1cm4gXCJleHBvcnQtbGlic1wiO1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJheGlvc1wiKSkgcmV0dXJuIFwiYXhpb3NcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogOTAwLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBaLFNBQVMsb0JBQW9CO0FBQ3ZiLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUV4QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE9BQU87QUFBQSxNQUNMLFNBQVMsQ0FBQywrQkFBK0IsY0FBYyxZQUFZO0FBQUEsSUFDckU7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsU0FBUztBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsT0FBTyxLQUFLO0FBQ1YsY0FBSSxJQUFJLElBQUksTUFBTSxxQ0FBcUMsR0FBRztBQUN4RCxtQkFBTyxJQUFJO0FBQUEsVUFDYjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxRQUFRLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsTUFDOUQsVUFBVSxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQ2hFLFlBQVksRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUNsRSxhQUFhLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsTUFDbkUsV0FBVyxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLElBQ25FO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsWUFBWTtBQUFBLElBQ1osS0FBSztBQUFBLEVBQ1A7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBO0FBQUEsSUFFUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixhQUFhLElBQUk7QUFDZixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsZ0JBQUksR0FBRyxTQUFTLFVBQVUsRUFBRyxRQUFPO0FBQ3BDLGdCQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBQ3BFLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUNqQyxnQkFBSSxHQUFHLFNBQVMsU0FBUyxLQUFLLEdBQUcsU0FBUyxNQUFNLEVBQUcsUUFBTztBQUMxRCxnQkFBSSxHQUFHLFNBQVMsY0FBYyxFQUFHLFFBQU87QUFDeEMsZ0JBQUksR0FBRyxTQUFTLE1BQU0sS0FBSyxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxhQUFhO0FBQzFFLHFCQUFPO0FBQ1QsZ0JBQUksR0FBRyxTQUFTLE9BQU8sRUFBRyxRQUFPO0FBQUEsVUFDbkM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
