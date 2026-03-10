# FE Skeleton (Electron + Vite + React)

## Run (Web only)

```bash
npm install
npm run dev
```

## Run (Electron + Sidecar)

```bash
npm install
npm run electron:dev
```

`electron/main.ts` 会在应用启动时拉起 `../BE` 下的 FastAPI sidecar，并在退出时发送 `SIGTERM`。
