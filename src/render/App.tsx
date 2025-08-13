import { Navigate, Route, Routes } from "react-router";
import Clientes from "./app/clientes";
import Turnos from "./app/turnos";
import Layout from "./app/layout";
import ClienteDetalle from "./app/clienteDetalle";
import Principal from "./app/principal";
import Tratamientos from "./app/tratamientos";
import Whatsapp from "./app/whatsapp";
import Calendario from "./app/calendario";
import AgendarTurno from "./app/agendarTurno";

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
