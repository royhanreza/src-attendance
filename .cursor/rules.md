# Cursor Project Rules

## 1. Package Management

- Always use **pnpm** as the package manager.
- Do **not** use npm or yarn under any circumstances.
- All dependency installation commands must use pnpm:
  ```bash
  pnpm install
  pnpm add <package>
  pnpm add -D <package>
  ```

## 2. UI Components

- Always use **shadcn/ui** for UI components.
- Do **not** create custom UI components if an equivalent exists in shadcn/ui.
- Do **not** use other UI libraries such as Material UI, Ant Design, Chakra UI, etc.
- Use the official shadcn/ui import pattern:
  ```ts
  import { Button } from "@/components/ui/button";
  ```

## 3. Styling & Colors

- Use **magenta** as the primary brand color throughout the application.
- Avoid **purple colors** in any form (except magenta as the primary color).
- Avoid **color gradients** of any kind.
- Use **solid, neutral colors** only.
- Preferred color palette:
  - **Magenta** (primary brand color)
  - Black
  - White
  - Gray
  - Blue, green, or red (solid only, no gradients)
- Maintain a clean, minimal, and professional visual style.

## 4. Design Principles

- Use Tailwind CSS following shadcn/ui defaults.
- Avoid over-styling or unnecessary visual effects.
- Ensure visual and structural consistency across all pages and components.

## 5. General Development Guidelines

- Favor clarity and maintainability over clever or complex solutions.
- Follow established project conventions before introducing new patterns.
- Write code that is easy to read, test, and extend.
