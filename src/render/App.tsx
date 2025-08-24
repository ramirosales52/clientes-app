import { Navigate, Route, Routes } from "react-router";
import Clientes from "./app/features/clientes/clientes";
import Turnos from "./app/features/turnos/turnos";
import Layout from "./app/layout";
import ClienteDetalle from "./app/features/clientes/clienteDetalle";
import Principal from "./app/principal";
import Tratamientos from "./app/features/tratamientos/tratamientos";
import Whatsapp from "./app/features/whatsapp/whatsapp";
import Calendario from "./app/features/turnos/calendario";
import AgendarTurno from "./app/features/turnos/agendarTurno";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/principal" />} />
      <Route element={<Layout />}>
        <Route path="/principal" element={<Principal />} />
        <Route path="/clientes/:id" element={<ClienteDetalle />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/tratamientos" element={<Tratamientos />} />
        <Route path="/whatsapp" element={<Whatsapp />} />
        <Route path="/agendar-turno" element={<AgendarTurno />} />
      </Route>
    </Routes>
  );
}

export default App;
