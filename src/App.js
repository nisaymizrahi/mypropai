import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import CompsTool from "./pages/CompsTool";
import NewInvestment from "./pages/NewInvestment";
import MyInvestments from "./pages/MyInvestments";
import InvestmentDetail from "./pages/InvestmentDetail"; // 👈 New import

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/comps"
          element={
            <DashboardLayout>
              <CompsTool />
            </DashboardLayout>
          }
        />
        <Route
          path="/investments"
          element={
            <DashboardLayout>
              <MyInvestments />
            </DashboardLayout>
          }
        />
        <Route
          path="/investments/new"
          element={
            <DashboardLayout>
              <NewInvestment />
            </DashboardLayout>
          }
        />
        <Route
          path="/investments/:id"
          element={
            <DashboardLayout>
              <InvestmentDetail />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
