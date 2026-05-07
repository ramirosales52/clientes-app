import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import { RefreshCw, Search, Users, UserCheck, UserMinus, CalendarClock, TrendingUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import AddUser from "@render/assets/undraw_add-user_rbko.svg";
import { ClientesModal } from "./components/clientes-modal";
import TablaClientes from "./components/clients-table";
import { DeleteClienteDialog } from "./components/delete-cliente-dialog";
import { useClientes, type ClienteConStats, type UpdateClienteData } from "@render/hooks/use-clientes";
import { Tabs, TabsList, TabsTrigger } from "@render/components/ui/tabs";
import dayjs from "dayjs";

type ClienteQuickFilter = "todos" | "con-turnos" | "sin-turnos" | "frecuentes" | "nuevos";

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

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<ClienteQuickFilter>("todos");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchClientes(1, value);
    }, 300);
  };

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

  const clientesFiltrados = useMemo(() => {
    const ahora = dayjs();

    if (quickFilter === "con-turnos") {
      return clientes.filter((cliente) => cliente.cantTurnos > 0);
    }

    if (quickFilter === "sin-turnos") {
      return clientes.filter((cliente) => cliente.cantTurnos === 0);
    }

    if (quickFilter === "frecuentes") {
      return clientes.filter((cliente) => cliente.cantTurnos >= 5);
    }

    if (quickFilter === "nuevos") {
      return clientes.filter((cliente) => dayjs(cliente.creadoEn).isAfter(ahora.subtract(30, "day")));
    }

    return clientes;
  }, [clientes, quickFilter]);

  const kpis = useMemo(() => {
    const total = clientes.length;
    const conTurnos = clientes.filter((cliente) => cliente.cantTurnos > 0).length;
    const sinTurnos = total - conTurnos;
    const totalTurnos = clientes.reduce((acc, cliente) => acc + cliente.cantTurnos, 0);
    const promedioTurnos = total > 0 ? totalTurnos / total : 0;
    const nuevos30d = clientes.filter((cliente) => dayjs(cliente.creadoEn).isAfter(dayjs().subtract(30, "day"))).length;

    return {
      total,
      conTurnos,
      sinTurnos,
      totalTurnos,
      promedioTurnos,
      nuevos30d,
    };
  }, [clientes]);

  return (
    <div className="flex flex-col h-full w-full gap-2 p-2 md:p-3">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestion de clientes del salon</p>
        </div>
        {clientes.length === 0 ? null : <ClientesModal />}
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con turnos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">{kpis.conTurnos}</p>
            <p className="text-xs text-muted-foreground">Clientes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sin turnos</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">{kpis.sinTurnos}</p>
            <p className="text-xs text-muted-foreground">Para reactivar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turnos acumulados</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.totalTurnos}</p>
            <p className="text-xs text-muted-foreground">Histórico total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio turnos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.promedioTurnos.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Por cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos 30d</CardTitle>
            <Badge variant="outline">30d</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sky-600">{kpis.nuevos30d}</p>
            <p className="text-xs text-muted-foreground">Altas recientes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <CardHeader className="gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Listado de clientes</CardTitle>
            <CardDescription>Busca, filtra y accede rápido al detalle de cada cliente.</CardDescription>
          </div>

            <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente..." className="w-56 pl-9" value={search} onChange={(e) => handleSearch(e.target.value)} />
            </div>

            <Tabs value={quickFilter} onValueChange={(value) => setQuickFilter(value as ClienteQuickFilter)}>
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="con-turnos">Con turnos</TabsTrigger>
                <TabsTrigger value="sin-turnos">Sin turnos</TabsTrigger>
                <TabsTrigger value="frecuentes">Frecuentes</TabsTrigger>
                <TabsTrigger value="nuevos">Nuevos</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchClientes(1)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="rounded-full bg-muted p-6">
                <img src={AddUser} className="h-12 w-12" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {clientes.length === 0 ? "No hay clientes registrados" : "No hay clientes para este filtro"}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {clientes.length === 0
                    ? "Agrega tu primer cliente para comenzar"
                    : "Prueba con otro filtro o limpia la búsqueda"}
                </p>
              </div>
              {clientes.length === 0 ? <ClientesModal /> : null}
            </div>
          ) : (
            <TablaClientes
              data={clientesFiltrados}
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
