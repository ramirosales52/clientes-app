import { Navigate, Route, Routes } from "react-router";
import Clientes from "./app/clientes";
import Turnos from "./app/turnos";
import Layout from "./app/layout";
import ClienteDetalle from "./app/clienteDetalle";
import Principal from "./app/principal";
import Tratamientos from "./app/tratamientos";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/principal" />} />
      <Route element={<Layout />}>
        <Route path="/principal" element={<Principal />} />
        <Route path="/clientes/:id" element={<ClienteDetalle />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/tratamientos" element={<Tratamientos />} />
      </Route>
    </Routes>
  );
}

export default App;
