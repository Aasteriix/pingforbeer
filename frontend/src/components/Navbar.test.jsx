// src/components/Navbar.test.jsx
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar.jsx";

describe("Navbar", () => {
  it("renders brand, main links and actions", () => {
    const onCreatePing = vi.fn();
    const onLogout = vi.fn();

    render(
      <MemoryRouter>
        <Navbar onCreatePing={onCreatePing} onLogout={onLogout} />
      </MemoryRouter>
    );

    // Brand – nu "Aura"
    expect(screen.getByText(/Aura/i)).toBeInTheDocument();

    // Huvudlänkar
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Create vibe/i)).toBeInTheDocument();
    expect(screen.getByText(/Connections/i)).toBeInTheDocument();

    // Actions
    expect(screen.getByText(/Set the vibe/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});
