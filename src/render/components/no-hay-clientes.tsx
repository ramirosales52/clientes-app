import { ClientesModal } from "./clientes-modal"
import AddUser from "@render/assets/undraw_add-user_rbko.svg"

function NoHayClientes() {
  return (
    <div className="w-full flex justify-center mt-20">
      <div className="h-72 w-72 flex flex-col items-center gap-4">
        <img src={AddUser} className="mb-4" />
        <h1>No hay clientes registrados.</h1>
        <ClientesModal />
      </div>
    </div>
  )
}

export default NoHayClientes
