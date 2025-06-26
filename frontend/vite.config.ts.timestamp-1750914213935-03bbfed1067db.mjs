// vite.config.ts
import { defineConfig } from "file:///__modal/volumes/vo-hNrNWSRoOOwFb8APrWcign/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///__modal/volumes/vo-hNrNWSRoOOwFb8APrWcign/frontend/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///__modal/volumes/vo-hNrNWSRoOOwFb8APrWcign/frontend/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/__modal/volumes/vo-hNrNWSRoOOwFb8APrWcign/frontend";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3e3,
    hmr: false,
    // Disabled HMR
    allowedHosts: [
      ".modal.host"
      // This will match any subdomain of modal.host
    ],
    timeout: 12e4,
    // 2 minutes
    watch: {
      usePolling: true,
      interval: 4e3
    }
  },
  build: {
    sourcemap: "inline",
    minify: "esbuild",
    outDir: "dist"
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvX19tb2RhbC92b2x1bWVzL3ZvLWhOck5XU1JvT093RmI4QVByV2NpZ24vZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9fX21vZGFsL3ZvbHVtZXMvdm8taE5yTldTUm9PT3dGYjhBUHJXY2lnbi9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vX19tb2RhbC92b2x1bWVzL3ZvLWhOck5XU1JvT093RmI4QVByV2NpZ24vZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjsgIGltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG4gIGltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG4gIGltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG4gIGltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuXG4gIC8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG4gIGV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiAzMDAwLFxuICAgICAgaG1yOiBmYWxzZSwgLy8gRGlzYWJsZWQgSE1SXG4gICAgICBhbGxvd2VkSG9zdHM6IFtcbiAgICAgICAgJy5tb2RhbC5ob3N0JyAgLy8gVGhpcyB3aWxsIG1hdGNoIGFueSBzdWJkb21haW4gb2YgbW9kYWwuaG9zdFxuICAgICAgXSxcbiAgICAgIHRpbWVvdXQ6IDEyMDAwMCwgLy8gMiBtaW51dGVzXG4gICAgICB3YXRjaDoge1xuICAgICAgICB1c2VQb2xsaW5nOiB0cnVlLFxuICAgICAgICBpbnRlcnZhbDogNDAwMFxuICAgICAgfVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6ICdpbmxpbmUnLFxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIG91dERpcjogJ2Rpc3QnXG4gICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXG4gICAgICBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2VSxTQUFTLG9CQUFvQjtBQUN4VyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGxDLElBQU0sbUNBQW1DO0FBTXZDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBO0FBQUEsSUFDTCxjQUFjO0FBQUEsTUFDWjtBQUFBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBO0FBQUEsSUFDVCxPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUEsTUFDWixVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxFQUNUO0FBQUEsRUFDQyxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUNULGdCQUFnQjtBQUFBLEVBQ2xCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
