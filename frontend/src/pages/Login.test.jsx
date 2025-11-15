// src/pages/Login.test.jsx
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./Login.jsx";
import * as api from "../api.js";

describe("Login page", () => {
  it("låter användaren logga in", async () => {
    const loginSpy = vi.spyOn(api, "login").mockResolvedValue({
      access_token: "fake-token",
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // matcha på placeholder istället för label
    fireEvent.change(screen.getByPlaceholderText(/your email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "secret" },
    });

    fireEvent.click(screen.getByRole("button", { name: /enter aura/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledTimes(1);
      expect(loginSpy).toHaveBeenCalledWith("user@example.com", "secret");
    });
  });
});
