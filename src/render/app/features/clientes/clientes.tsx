import TablaClientes from "@render/components/clients-table";
import { ClientesModal } from "@render/components/clientes-modal";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import axios from "axios";
import { RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import AddUser from "@render/assets/undraw_add-user_rbko.svg"

function Clientes() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchData = async (pageToFetch = 1) => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/clientes?page=${pageToFetch}&limit=20`);

      const clientesConCantidad = response.data.data.map((cliente: any) => ({
        ...cliente,
        cantTurnos: cliente.turnos.length,
      }));

      setData((prev) => pageToFetch === 1 ? clientesConCantidad : [...prev, ...clientesConCantidad]);
      setHasMore(response.data.hasMore);
      setPage(pageToFetch + 1);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(1);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Clientes</h1>
        {data.length == 0 ? null : (
          <ClientesModal />
        )}
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
              <Button onClick={() => fetchData(1)}>
                <RefreshCw />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 max-h-[83vh]">
          {data.length == 0 ? (
            <div className="w-full flex justify-center mt-16">
              <div className="h-72 w-72 flex flex-col items-center gap-4">
                <img src={AddUser} className="mb-4" />
                <h1>No hay clientes registrados.</h1>
                <ClientesModal />
              </div>
            </div>
          ) : (

            <TablaClientes
              data={data}
              fetchMore={() => fetchData(page)}
              hasMore={hasMore}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Clientes;
