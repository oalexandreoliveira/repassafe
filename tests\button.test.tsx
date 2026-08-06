import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
describe("Button",()=>{it("preserva nome acessível",()=>{render(<Button>Continuar</Button>);expect(screen.getByRole("button",{name:"Continuar"})).toBeInTheDocument()})});
