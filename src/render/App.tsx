import { Navigate, Route, Routes } from "react-router";
import Clientes from "./app/features/clientes/clientes";
import Turno from "./app/features/turno/turno";
import NuevoTurno from "./app/features/turno/nuevo";
import Layout from "./app/layout";
import ClienteDetalle from "./app/features/clientes/clienteDetalle";
import Principal from "./app/principal";
import Tratamientos from "./app/features/tratamientos/tratamientos";
import Whatsapp from "./app/features/whatsapp/whatsapp";
import Calendario from "./app/features/turno/calendario";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/principal" />} />
      <Route element={<Layout />}>
        <Route path="/principal" element={<Principal />} />
        <Route path="/clientes/:id" element={<ClienteDetalle />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/turno" element={<Turno />} />
        <Route path="/turno/nuevo" element={<NuevoTurno />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/tratamientos" element={<Tratamientos />} />
        <Route path="/whatsapp" element={<Whatsapp />} />
        {/* Redirect old routes */}
        <Route path="/turnos" element={<Navigate to="/turno" />} />
        <Route path="/agendar-turno" element={<Navigate to="/turno/nuevo" />} />
      </Route>
    </Routes>
  );
}

export default App;
