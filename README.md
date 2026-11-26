# Xentrix · Eventos (Angular 18)

Backend: `http://localhost:28080/back-xentrix/api/v1`

| Método | Endpoint                 | Uso                                        |
|--------|--------------------------|--------------------------------------------|
| GET    | `/local/events/getAll`   | Botón "Buscar todos" (puebla la tabla)     |
| GET    | `/local/events/get/{id}` | Botón "Buscar por id" (tabla con 1 evento) |
| POST   | `/local/events/create`   | Formulario "Nuevo evento" (con modales)    |

## Ejecutar

```bash
npm install
npm start          # http://localhost:4200
```

En desarrollo, `ng serve` usa `src/proxy.conf.json`: reenvía `/back-xentrix/**` a
`http://localhost:28080` (sin problemas de CORS). Si cambias host o puerto, edítalo ahí.
Para producción, ajusta `apiUrl` en `src/environments/environment.prod.ts` y habilita CORS en el backend.

## Comportamiento

- Una sola tabla: "Buscar todos", "Buscar por id" y "Limpiar búsqueda".
- Crear evento: modal de confirmación → POST → modal con el mensaje que responde el backend.
- Cualquier fallo de las consultas muestra un modal de error general con botón "Cerrar".
- El backend responde HTTP 200 aun en errores (texto `...EventsController - mensaje`);
  el servicio lo detecta y lo trata como error.
