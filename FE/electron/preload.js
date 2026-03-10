import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("ta", {
  version: "0.1.0",
});
