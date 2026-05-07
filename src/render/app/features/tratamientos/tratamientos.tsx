import { Button } from "@render/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import { RefreshCw, Search, Sparkles, ClipboardList } from "lucide-react";
import { useState } from "react";
import TratamientosModal, {
  type TratamientoFormData,
} from "./components/tratamientos-modal";
import TratamientosTable from "./components/tratamientos-table";
import TratamientoDetailSheet from "./components/tratamiento-detail-sheet";
import DeleteTratamientoDialog from "./components/delete-tratamiento-dialog";
import {
  useTratamientos,
  type Tratamiento,
} from "@render/hooks/use-tratamientos";
import { Skeleton } from "@render/components/ui/skeleton";

function Tratamientos() {
  const {
    tratamientos,
    loading,
    fetchTratamientos,
    createTratamiento,
    updateTratamiento,
    deleteTratamiento,
    fetchHistorialPrecios,
  } = useTratamientos();

  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTratamiento, setEditingTratamiento] =
    useState<Tratamiento | null>(null);

  // Detail sheet state
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] =
    useState<Tratamiento | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTratamiento, setDeletingTratamiento] =
    useState<Tratamiento | null>(null);

  const filteredTratamientos = tratamientos.filter((t) =>
    t.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingTratamiento(null);
    setModalOpen(true);
  };

  const handleViewDetail = (tratamiento: Tratamiento) => {
    setSelectedTratamiento(tratamiento);
    setDetailSheetOpen(true);
  };

  const handleEdit = (tratamiento: Tratamiento) => {
    setEditingTratamiento(tratamiento);
    setModalOpen(true);
  };

  const handleDelete = (tratamiento: Tratamiento) => {
    setDeletingTratamiento(tratamiento);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: TratamientoFormData) => {
    if (editingTratamiento) {
      await updateTratamiento(editingTratamiento.id, data);
    } else {
      await createTratamiento(data);
    }
  };

  const handleConfirmDelete = async (tratamiento: Tratamiento) => {
    await deleteTratamiento(tratamiento.id);
  };

  const isEmpty = tratamientos.length === 0 && !loading;
  const hasNoResults = filteredTratamientos.length === 0 && !isEmpty;

  return (
    <div className="flex flex-col h-full w-full gap-2 p-2 md:p-3">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Tratamientos</h1>
          <p className="text-sm text-muted-foreground">Servicios y precios del salon</p>
        </div>
        {!isEmpty && (
          <Button onClick={handleCreate}>
            <Sparkles className="h-4 w-4" />
            <span>Agregar tratamiento</span>
          </Button>
        )}
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <CardHeader className="pb-3">
          {!isEmpty && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tratamiento..."
                  className="w-56 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchTratamientos()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredTratamientos.length} tratamiento{filteredTratamientos.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="w-full flex justify-center mt-16">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-6">
                  <ClipboardList className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    No hay tratamientos registrados
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Agrega tu primer tratamiento para comenzar
                  </p>
                </div>
                <Button onClick={handleCreate}>
                  <Sparkles className="h-4 w-4" />
                  <span>Agregar tratamiento</span>
                </Button>
              </div>
            </div>
          ) : hasNoResults ? (
            <div className="w-full flex justify-center mt-16">
              <div className="flex flex-col items-center gap-2 text-center">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No se encontraron tratamientos para "{searchQuery}"
                </p>
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="text-sm"
                >
                  Limpiar busqueda
                </Button>
              </div>
            </div>
          ) : (
            <TratamientosTable
              data={filteredTratamientos}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de crear/editar */}
      <TratamientosModal
        tratamiento={editingTratamiento}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />

      {/* Sheet de detalle */}
      <TratamientoDetailSheet
        tratamiento={selectedTratamiento}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
        fetchHistorial={fetchHistorialPrecios}
      />

      {/* Dialog de confirmacion de eliminacion */}
      <DeleteTratamientoDialog
        tratamiento={deletingTratamiento}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Tratamientos;
