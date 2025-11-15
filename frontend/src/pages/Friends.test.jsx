// src/pages/Friends.test.jsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import Friends from "./Friends.jsx";

// Mocka useAuth så sidan tror att vi är inloggade
vi.mock("../useAuth.jsx", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

// Mocka API-anropen som Friends använder
const mockGetIncomingRequests = vi.fn();
const mockGetFriends = vi.fn();

vi.mock("../api", () => ({
  searchUsers: vi.fn().mockResolvedValue([]),
  getIncomingRequests: (...args) => mockGetIncomingRequests(...args),
  getFriends: (...args) => mockGetFriends(...args),
  requestFriend: vi.fn(),
  approveFriend: vi.fn(),
  declineFriend: vi.fn(),
  deleteFriend: vi.fn(),
}));

function renderFriends() {
  return render(
    <MemoryRouter>
      <Friends />
    </MemoryRouter>
  );
}

describe("Friends page", () => {
  it("visar tabs och uppdaterar counts efter API-anrop", async () => {
    // arrange: mockade svar
    mockGetIncomingRequests.mockResolvedValueOnce([
      { id: 1, name: "Requester One", email: "req1@example.com" },
    ]);
    mockGetFriends.mockResolvedValueOnce([
      { id: 2, name: "Friend One", email: "friend1@example.com" },
    ]);

    renderFriends();

    // Tabs syns direkt – skippa Search-tabben (den finns dubbelt)
    const requestsTab = screen.getByRole("button", { name: /Requests/i });
    const connectionsTab = screen.getByRole("button", { name: /Connections/i });

    expect(requestsTab).toBeInTheDocument();
    expect(connectionsTab).toBeInTheDocument();

    // Vänta tills counts uppdaterats
    await waitFor(() => {
      const updatedRequestsTab = screen.getByRole("button", { name: /Requests/i });
      const updatedConnectionsTab = screen.getByRole("button", { name: /Connections/i });

      expect(updatedRequestsTab.textContent).toMatch(/\(1\)/);
      expect(updatedConnectionsTab.textContent).toMatch(/\(1\)/);
    });
  });
});
