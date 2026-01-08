# AGENTS.md

Guidelines for AI agents working in this codebase.

## Project Overview

This is an Electron desktop application for salon/appointment management ("clientas" = clients in Spanish).

- **Frontend**: React 19 + Vite (renderer process)
- **Backend**: NestJS (main process, serves API at localhost:3000)
- **Desktop**: Electron 34
- **Database**: SQLite with TypeORM

Domain terms and comments are in Spanish.

## Commands

```bash
npm run dev      # Start development mode
npm run build    # Build for production
npm run debug    # Start with debug mode (--dsb-debug)
```

No test framework is configured. No linting commands.

## Project Structure

```
src/
├── main/                    # Electron main process + NestJS bootstrap
│   ├── index.ts             # Entry point
│   └── app.module.ts        # Root NestJS module
├── preload/                 # Electron preload scripts for IPC
├── render/                  # React frontend (renderer process)
│   ├── App.tsx              # Root component
│   ├── app/
│   │   ├── layout.tsx       # Main layout with sidebar
│   │   └── features/        # Feature modules (clientes, turnos, etc.)
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions (cn, etc.)
│   └── assets/              # Static assets (images, SVGs)
└── api/                     # NestJS backend modules
    ├── clientes/            # Customer management
    ├── turnos/              # Appointment scheduling
    ├── tratamientos/        # Treatments/services
    ├── whatsapp/            # WhatsApp integration
    └── entities/            # Entity exports
```

### NestJS Module Structure

Each API module follows this structure:

```
src/api/{module}/
├── {module}.module.ts
├── {module}.controller.ts
├── {module}.service.ts
├── entities/
│   └── {entity}.entity.ts
└── dto/
    ├── create-{entity}.dto.ts
    └── update-{entity}.dto.ts
```

## Path Aliases

Use these aliases instead of relative paths:

```typescript
import { Button } from "@render/components/ui/button"; // src/render/components/ui/button
import { Something } from "@main/utils"; // src/main/utils
import { Card } from "@components/ui/card"; // src/render/components/ui/card
```

## Naming Conventions

### Files

| Type               | Convention                 | Example                    |
| ------------------ | -------------------------- | -------------------------- |
| React pages        | `camelCase.tsx`            | `clientes.tsx`             |
| React components   | `kebab-case.tsx`           | `clientes-modal.tsx`       |
| UI components      | `kebab-case.tsx`           | `button.tsx`, `dialog.tsx` |
| NestJS services    | `kebab-case.service.ts`    | `clientes.service.ts`      |
| NestJS controllers | `kebab-case.controller.ts` | `clientes.controller.ts`   |
| NestJS modules     | `kebab-case.module.ts`     | `clientes.module.ts`       |
| Entities           | `kebab-case.entity.ts`     | `cliente.entity.ts`        |
| DTOs               | `kebab-case.dto.ts`        | `create-cliente.dto.ts`    |

### Code

| Type             | Convention                            | Example                            |
| ---------------- | ------------------------------------- | ---------------------------------- |
| React components | PascalCase                            | `function ClientesModal()`         |
| Functions        | camelCase                             | `fetchData()`, `validarTelefono()` |
| Variables        | camelCase                             | `const loading`, `const hasMore`   |
| Constants        | UPPER_SNAKE_CASE                      | `const MOBILE_BREAKPOINT = 768`    |
| Types/Interfaces | PascalCase (no `I`)                   | `interface Cliente`, `type Props`  |
| Enums            | PascalCase + UPPER_SNAKE_CASE members | See below                          |

```typescript
export enum EstadoTurno {
  PENDIENTE = "pendiente",
  CONFIRMADO = "confirmado",
  CANCELADO = "cancelado",
}
```

## Import Organization

Order imports as follows:

1. Third-party libraries (`react`, `axios`, `zod`)
2. Framework imports (`@nestjs/*`, `@radix-ui/*`)
3. Path-aliased imports (`@render/`, `@main/`, `@components/`)
4. Relative imports (`./components`, `../entities`)

```typescript
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@render/components/ui/button";
import { ClientesModal } from "./components/clientes-modal";
```

## React Patterns

- **Functional components only** - no class components
- Small components, with a single responsability
- **Forms**: React Hook Form + Zod for validation
- **Toasts**: Use `sonner` for notifications (`toast()`, `toast.error()`)
- **Icons**: Lucide React (`lucide-react`)
- **Styling**: Tailwind CSS with `cn()` utility for class merging
- Components should remain as lean as possible.
- Do not implement business logic, data processing, or side–effects directly inside UI components.

Instead, the agent should:

- Extract reusable logic into custom hooks.
- Keep components focused on rendering and interaction only.
- Centralize stateful or async logic inside hooks rather than components.
- Avoid duplicating code or scattering logic across multiple components.
- Prefer hooks that are modular, testable, and composable.

The goal is to maintain a clean separation between UI and logic, ensuring readability, reuse, and easier maintenance.

### Component Variants with CVA

```typescript
import { cva } from "class-variance-authority";

const buttonVariants = cva("inline-flex items-center...", {
  variants: {
    variant: { default: "bg-primary...", destructive: "bg-destructive..." },
    size: { default: "h-9 px-4", sm: "h-8 px-3" },
  },
});
```

### Utility Function

```typescript
import { cn } from "@render/lib/utils";

<div className={cn("base-class", conditional && "conditional-class")} />
```

## NestJS Patterns

### Services

- Inject repositories with `@InjectRepository(Entity)`
- Return promises from async methods
- Throw NestJS exceptions for errors

```typescript
@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException("Cliente no encontrado");
    return cliente;
  }
}
```

### DTOs

Use `class-validator` decorators for validation:

```typescript
export class CreateClienteDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}
```

## Error Handling

### Backend (NestJS)

Use NestJS exception classes:

```typescript
throw new NotFoundException("Cliente no encontrado");
throw new BadRequestException("Número de teléfono inválido");
```

### Frontend (React)

Wrap async operations in try/catch, log errors, show toast:

```typescript
try {
  await axios.post("http://localhost:3000/clientes", data);
  toast("Cliente creado correctamente");
} catch (err) {
  console.error("Error creando el cliente:", err);
  toast.error("Error al crear cliente");
}
```

## Styling

- **Tailwind CSS v4** with `tailwindcss-animate` plugin
- **shadcn/ui components** in `/src/render/components/ui/`
- **Theme**: Light mode
- **Custom utilities**: don't use custom utilities, just Tailwind basics

## Design Guidelines

The visual style must remain clean, simple, and consistent all shadcn/ui based.
Avoid complex gradients, heavy shadows, or any decorative effects that add unnecessary visual noise.

The design should:

- Follow the current color palette.
- Maintain a minimalistic and functional aesthetic.
- Prioritize readability and visual clarity.
- Avoid unnecessary embellishments that distract from the content.
- Use clear spacing and simple typographic hierarchy.
- No color degrades, no emojis.
- Minimal shadows.
- No fancy components.

The overall goal is for every element to feel coherent and easy to understand at a glance.

## Database

- SQLite database (`db.sql` in root)
- TypeORM with `synchronize: true` (auto-migrations in dev)
- Entities define both schema and TypeScript types

## Token Efficiency Guidelines

Responses must be concise and purposeful.
Avoid unnecessary verbosity, repeated explanations, or filler sentences.

To reduce token usage, the agent should:

- Provide direct answers without restating the question.
- Use short, clear sentences.
- Avoid over-explaining common concepts.
- Skip disclaimers unless explicitly required.
- Prefer lists over long paragraphs when appropriate.
- Reuse previously established context instead of rewriting it.
- Keep code examples minimal, only showing what is essential.

The objective is to maximize clarity while minimizing token consumption.
