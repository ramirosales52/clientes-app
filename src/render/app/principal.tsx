import { Card, CardHeader, CardTitle } from "@render/components/ui/card"

function Principal() {
  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div className="grid grid-cols-4 gap-4 h-32">
        <Card className="bg-chart-2/90 border-3 border-chart-2">
          <CardHeader>
            <CardTitle></CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-chart-3/90 border-3 border-chart-3">
          <CardHeader>
            <CardTitle></CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-chart-4/90 border-3 border-chart-4">
          <CardHeader>
            <CardTitle></CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-chart-5/90 border-3 border-chart-5">
          <CardHeader>
            <CardTitle></CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export default Principal
