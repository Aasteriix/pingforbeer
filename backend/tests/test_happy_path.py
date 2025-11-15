# backend/tests/test_happy_path.py
def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_full_flow_register_friends_aura(client):
    # 1. Registrera två användare
    r1 = client.post(
        "/api/auth/register",
        json={
            "email": "user1@example.com",
            "name": "User One",
            "password": "secret1",
            "timezone": "Europe/Stockholm",
        },
    )
    assert r1.status_code == 200
    token1 = r1.json()["access_token"]

    r2 = client.post(
        "/api/auth/register",
        json={
            "email": "user2@example.com",
            "name": "User Two",
            "password": "secret2",
            "timezone": "Europe/Stockholm",
        },
    )
    assert r2.status_code == 200
    token2 = r2.json()["access_token"]

    # 2. Hämta /me för båda
    me1 = client.get("/api/me", headers=auth_header(token1)).json()
    me2 = client.get("/api/me", headers=auth_header(token2)).json()
    user1_id = me1["id"]
    user2_id = me2["id"]

    # 3. User1 skickar friend request till user2
    r = client.post(f"/api/friends/{user2_id}/request", headers=auth_header(token1))
    assert r.status_code == 200

    # 4. User2 ser inkommande requests
    r = client.get("/api/friends/requests/incoming", headers=auth_header(token2))
    assert r.status_code == 200
    incoming = r.json()
    assert len(incoming) == 1
    assert incoming[0]["id"] == user1_id

    # 5. User2 accepterar vänskap
    r = client.post(f"/api/friends/{user1_id}/approve", headers=auth_header(token2))
    assert r.status_code == 200

    # 6. User1 skapar en aura och bjuder in user2
    r = client.post(
        "/api/pings",
        headers=auth_header(token1),
        json={
            "title": "After work",
            "location": "Local bar",
            "starts_at": "2030-01-01T18:00:00Z",
            "invitee_ids": [user2_id],
            "notes": "Kom som du är!",
        },
    )
    assert r.status_code == 201
    aura = r.json()
    assert aura["title"] == "After work"
    assert len(aura["invites"]) == 1
    assert aura["invites"][0]["user"]["id"] == user2_id

    # 7. User2 ser auran i inbox
    r = client.get("/api/pings/inbox", headers=auth_header(token2))
    assert r.status_code == 200
    inbox = r.json()
    assert len(inbox) == 1
    assert inbox[0]["title"] == "After work"

    # 8. User2 svarar på inbjudan
    aura_id = inbox[0]["id"]
    r = client.post(
        f"/api/pings/{aura_id}/respond",
        headers=auth_header(token2),
        json={"status": "accepted"},
    )
    assert r.status_code == 200

    # 9. Kolla att status uppdaterats
    r = client.get("/api/pings/inbox", headers=auth_header(token2))
    inbox = r.json()
    assert inbox[0]["invites"][0]["status"] == "accepted"
