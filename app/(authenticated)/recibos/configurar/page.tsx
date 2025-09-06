"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ConfigurarRecibosPage() {
  const [form, setForm] = useState({
    host: "",
    port: "",
    user: "",
    pass: "",
    from: "",
  })

  const save = async () => {
    await fetch("/api/recibos/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Configurar envío de recibos (SMTP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Host</Label>
                <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
              </div>
              <div>
                <Label>Puerto</Label>
                <Input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
              </div>
              <div>
                <Label>Usuario</Label>
                <Input value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Remitente (From)</Label>
                <Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button onClick={save}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


