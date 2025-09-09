"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Cliente {
  IdCliente: number
  RazonSocial: string
  RucDni: string
  Estado: string
}

interface ClienteSearchProps {
  onClienteSelect: (cliente: Cliente | null) => void
  clienteSeleccionado?: Cliente | null
  placeholder?: string
  disabled?: boolean
  incluirInactivos?: boolean
}

export function ClienteSearch({ 
  onClienteSelect, 
  clienteSeleccionado, 
  placeholder = "Buscar cliente...",
  disabled = false,
  incluirInactivos = false
}: ClienteSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)

  const buscarClientes = useCallback(async (query: string) => {
    if (query.length < 2) {
      setClientes([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/clientes/search?q=${encodeURIComponent(query)}${incluirInactivos ? '&incluirInactivos=true' : ''}`)
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes || [])
      }
    } catch (error) {
      console.error("Error buscando clientes:", error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }, [incluirInactivos])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue) {
        buscarClientes(searchValue)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchValue, buscarClientes])

  const handleSelect = (cliente: Cliente) => {
    onClienteSelect(cliente)
    setOpen(false)
    setSearchValue("")
  }

  const handleClear = () => {
    onClienteSelect(null)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {clienteSeleccionado ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">{clienteSeleccionado.RazonSocial}</span>
              <span className="text-muted-foreground text-xs">({clienteSeleccionado.RucDni})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar por nombre o RUC/DNI..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Search className="h-4 w-4 animate-pulse mx-auto mb-2" />
                Buscando...
              </div>
            )}

            {!loading && searchValue.length >= 2 && clientes.length === 0 && (
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            )}

            {!loading && searchValue.length < 2 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}

            {clienteSeleccionado && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleClear}
                  className="text-red-600 hover:text-red-700"
                >
                  <span>Limpiar selección</span>
                </CommandItem>
              </CommandGroup>
            )}

            {clientes.length > 0 && (
              <CommandGroup>
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.IdCliente}
                    value={`${cliente.RazonSocial} ${cliente.RucDni}`}
                    onSelect={() => handleSelect(cliente)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          clienteSeleccionado?.IdCliente === cliente.IdCliente
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="font-medium">{cliente.RazonSocial}</div>
                        <div className="text-xs text-muted-foreground">
                          {cliente.RucDni}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded",
                          cliente.Estado === "ACTIVO"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {cliente.Estado}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
