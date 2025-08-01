import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./ui/table"
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Badge } from "./ui/badge"

interface Cliente {
  id: string
  nombre: string
  apellido: string
  codArea: string
  numero: string
  turnos: any[]
  cantTurnos: number
}

type SortField = keyof Cliente
type SortDirection = "asc" | "desc" | null

interface Props {
  data: Cliente[]
  fetchMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

function TablaClientes({ data, fetchMore, hasMore = false, loading = false }: Props) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !fetchMore || !hasMore) return;

    let debounceTimer: NodeJS.Timeout;

    const handleScroll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollTop + clientHeight >= scrollHeight - 150) {
          fetchMore();
        }
      }, 150);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [fetchMore, hasMore]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : sortDirection === "desc"
            ? null
            : "asc"
      )
      if (sortDirection === "desc") setSortField(null)
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortedClients = () => {
    if (!sortField || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue, "es", { sensitivity: "base" })
        return sortDirection === "asc" ? comparison : -comparison
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === "asc") return <ChevronUp className="ml-2 h-4 w-4" />
    if (sortDirection === "desc") return <ChevronDown className="ml-2 h-4 w-4" />
    return <ChevronsUpDown className="ml-2 h-4 w-4" />
  }

  const pluralizeTurnos = (count: number) =>
    `${count} ${count === 1 ? "Turno" : "Turnos"}`

  const sortedClients = getSortedClients()

  return (
    <div
      className="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-muted scrollbar-track-transparent"
      ref={scrollRef}
    >
      <Table>
        <TableHeader className="bg-background sticky top-0 z-20">
          <TableRow>
            {["nombre", "apellido", "telefono", "cantTurnos"].map((field) => (
              <TableHead
                key={field}
                className="cursor-pointer select-none"
                onClick={() => handleSort(field as SortField)}
                title={`Ordenar por ${field}`}
              >
                <div className="flex items-center">
                  {field === "cantTurnos"
                    ? "Turnos"
                    : field === "telefono"
                      ? "Teléfono"
                      : capitalize(field)}
                  {getSortIcon(field as SortField)}
                </div>
              </TableHead>
            ))}
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">
                No hay clientes para mostrar.
              </TableCell>
            </TableRow>
          ) : (
            sortedClients.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.nombre}</TableCell>
                <TableCell>{cliente.apellido}</TableCell>
                <TableCell>({cliente.codArea}) {cliente.numero}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {pluralizeTurnos(cliente.turnos.length)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      alert(
                        `Ver detalle de: ${cliente.nombre} ${cliente.apellido}`
                      )
                    }
                  >
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {loading && (
        <div className="py-4 text-center text-muted-foreground">
          Cargando más clientes...
        </div>
      )}
    </div>
  )
}

export default TablaClientes

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

