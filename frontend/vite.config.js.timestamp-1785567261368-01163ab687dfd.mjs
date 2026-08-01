// vite.config.js
import { defineConfig } from "file:///C:/Users/gogul/Downloads/GNS%20Insights/Insights/GNS%20Insights/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/gogul/Downloads/GNS%20Insights/Insights/GNS%20Insights/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/gogul/Downloads/GNS%20Insights/Insights/GNS%20Insights/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnb2d1bFxcXFxEb3dubG9hZHNcXFxcR05TIEluc2lnaHRzXFxcXEluc2lnaHRzXFxcXEdOUyBJbnNpZ2h0c1xcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ29ndWxcXFxcRG93bmxvYWRzXFxcXEdOUyBJbnNpZ2h0c1xcXFxJbnNpZ2h0c1xcXFxHTlMgSW5zaWdodHNcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2dvZ3VsL0Rvd25sb2Fkcy9HTlMlMjBJbnNpZ2h0cy9JbnNpZ2h0cy9HTlMlMjBJbnNpZ2h0cy9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjEyNy4wLjAuMVwiLFxyXG4gICAgcG9ydDogNTE3MyxcclxuICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxyXG4gICAgd2F0Y2g6IHtcclxuICAgICAgaWdub3JlZDogW1wiKiovbm9kZV9tb2R1bGVzX2Jha19wdXNoLyoqXCIsIFwiKiovZGlzdC8qKlwiLCBcIioqLy5naXQvKipcIl0sXHJcbiAgICB9LFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgLy8gUHJveHkgQVBJIHJlcXVlc3RzIHdoaWxlIGJ5cGFzc2luZyBzdGF0aWMgcHVibGljIGFzc2V0cyAoLnBuZywgLmpwZywgZXRjLilcclxuICAgICAgXCIvYXV0aFwiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly8xMjcuMC4wLjE6ODAwMFwiLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBieXBhc3MocmVxKSB7XHJcbiAgICAgICAgICBpZiAocmVxLnVybC5tYXRjaCgvXFwuKHBuZ3xqcGd8anBlZ3xnaWZ8c3ZnfHdlYnB8aWNvKSQvaSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcS51cmw7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCIvYXBpXCI6IHsgdGFyZ2V0OiBcImh0dHA6Ly8xMjcuMC4wLjE6ODAwMFwiLCBjaGFuZ2VPcmlnaW46IHRydWUgfSxcclxuICAgICAgXCIvdGFza3NcIjogeyB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxyXG4gICAgICBcIi9zaWRlYmFyXCI6IHsgdGFyZ2V0OiBcImh0dHA6Ly8xMjcuMC4wLjE6ODAwMFwiLCBjaGFuZ2VPcmlnaW46IHRydWUgfSxcclxuICAgICAgXCIvcGxhdGZvcm1cIjogeyB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxyXG4gICAgICBcIi9oZWFsdGhcIjogeyB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHRlc3Q6IHtcclxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgc2V0dXBGaWxlczogXCIuL3NyYy90ZXN0L3NldHVwLmpzXCIsXHJcbiAgICBjc3M6IGZhbHNlLFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIC8vIEZhc3RlciBtaW5pZmljYXRpb247IGVzYnVpbGQgaXMgZGVmYXVsdCBpbiBWaXRlIDUgXHUyMDEzIGtlZXAgZXhwbGljaXQgZm9yIGNsYXJpdHlcclxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXHJcbiAgICAvLyBTbWFsbGVyIGluaXRpYWwgbG9hZDogc3BsaXQgaGVhdnkgdmVuZG9ycyBzbyB0aGV5IGNhY2hlIGFuZCBsb2FkIGluIHBhcmFsbGVsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpKSB7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlY2hhcnRzXCIpKSByZXR1cm4gXCJyZWNoYXJ0c1wiO1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdC1kb21cIikgfHwgaWQuaW5jbHVkZXMoXCJyZWFjdC1yb3V0ZXJcIikpIHJldHVybiBcInJlYWN0LXZlbmRvclwiO1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdFwiKSkgcmV0dXJuIFwicmVhY3QtdmVuZG9yXCI7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImkxOG5leHRcIikgfHwgaWQuaW5jbHVkZXMoXCJpMThuXCIpKSByZXR1cm4gXCJpMThuXCI7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImx1Y2lkZS1yZWFjdFwiKSkgcmV0dXJuIFwiaWNvbnNcIjtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwieGxzeFwiKSB8fCBpZC5pbmNsdWRlcyhcImpzcGRmXCIpIHx8IGlkLmluY2x1ZGVzKFwiaHRtbDJjYW52YXNcIikpXHJcbiAgICAgICAgICAgICAgcmV0dXJuIFwiZXhwb3J0LWxpYnNcIjtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiYXhpb3NcIikpIHJldHVybiBcImF4aW9zXCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDkwMCxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrWixTQUFTLG9CQUFvQjtBQUMvYSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixPQUFPO0FBQUEsTUFDTCxTQUFTLENBQUMsK0JBQStCLGNBQWMsWUFBWTtBQUFBLElBQ3JFO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxNQUVMLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLE9BQU8sS0FBSztBQUNWLGNBQUksSUFBSSxJQUFJLE1BQU0scUNBQXFDLEdBQUc7QUFDeEQsbUJBQU8sSUFBSTtBQUFBLFVBQ2I7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUSxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQzlELFVBQVUsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUNoRSxZQUFZLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsTUFDbEUsYUFBYSxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQ25FLFdBQVcsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxJQUNuRTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxJQUNaLEtBQUs7QUFBQSxFQUNQO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQTtBQUFBLElBRVIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sYUFBYSxJQUFJO0FBQ2YsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLGdCQUFJLEdBQUcsU0FBUyxVQUFVLEVBQUcsUUFBTztBQUNwQyxnQkFBSSxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxjQUFjLEVBQUcsUUFBTztBQUNwRSxnQkFBSSxHQUFHLFNBQVMsT0FBTyxFQUFHLFFBQU87QUFDakMsZ0JBQUksR0FBRyxTQUFTLFNBQVMsS0FBSyxHQUFHLFNBQVMsTUFBTSxFQUFHLFFBQU87QUFDMUQsZ0JBQUksR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBQ3hDLGdCQUFJLEdBQUcsU0FBUyxNQUFNLEtBQUssR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsYUFBYTtBQUMxRSxxQkFBTztBQUNULGdCQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUFBLFVBQ25DO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
