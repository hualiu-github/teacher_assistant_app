import { Navigate, Route, Routes } from "react-router-dom";
import { MainPage } from "./pages/MainPage";
import { DetailPage } from "./pages/DetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/detail/:courseId" element={<DetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

