import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import { RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import AddUser from "@render/assets/undraw_add-user_rbko.svg";
import { ClientesModal } from "./components/clientes-modal";
import TablaClientes from "./components/clients-table";
import { DeleteClienteDialog } from "./components/delete-cliente-dialog";
import { useClientes, type ClienteConStats, type UpdateClienteData } from "@render/hooks/use-clientes";

function Clientes() {
  const {
    clientes,
    loading,
    hasMore,
    fetchClientes,
    fetchMore,
    updateCliente,
    deleteCliente,
  } = useClientes();

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<ClienteConStats | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<ClienteConStats | null>(null);

  const handleEdit = (cliente: ClienteConStats) => {
    setClienteToEdit(cliente);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (data: UpdateClienteData) => {
    if (!clienteToEdit) return;
    await updateCliente(clienteToEdit.id, data);
    setEditModalOpen(false);
    setClienteToEdit(null);
  };

  const handleDelete = (cliente: ClienteConStats) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return;
    await deleteCliente(clienteToDelete.id);
    setDeleteDialogOpen(false);
    setClienteToDelete(null);
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Clientes</h1>
        {clientes.length === 0 ? null : <ClientesModal />}
      </div>

      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={22} />
              <span>Lista de Clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar" className="w-96" />
              <Button onClick={() => fetchClientes(1)}>
                <RefreshCw />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 max-h-[83vh]">
          {clientes.length === 0 ? (
            <div className="w-full flex justify-center mt-16">
              <div className="h-72 w-72 flex flex-col items-center gap-4">
                <img src={AddUser} className="mb-4" />
                <h1>No hay clientes registrados.</h1>
                <ClientesModal />
              </div>
            </div>
          ) : (
            <TablaClientes
              data={clientes}
              fetchMore={fetchMore}
              hasMore={hasMore}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ClientesModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setClienteToEdit(null);
        }}
        cliente={clienteToEdit}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Dialog */}
      <DeleteClienteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setClienteToDelete(null);
        }}
        cliente={clienteToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default Clientes;
