from test_happy_path import auth_header


def register_user(client, email, name, password="secret", tz="Europe/Stockholm"):
    r = client.post("/api/auth/register", json={
        "email": email,
        "name": name,
        "password": password,
        "timezone": tz,
    })
    assert r.status_code == 200
    return r.json()["access_token"]


def test_create_aura_without_invitees_returns_400(client):
    token = register_user(client, "user1@example.com", "User One")

    r = client.post(
        "/api/pings",
        headers=auth_header(token),
        json={
            "title": "Solo vibe",
            "location": "Home",
            "starts_at": "2030-01-01T18:00:00Z",
            "invitee_ids": [],
            "notes": "No one invited",
        },
    )

    assert r.status_code == 400
    body = r.json()
    assert "At least one invitee" in body.get("detail", "")


def test_create_aura_with_non_friend_invitee_returns_400(client):
    token1 = register_user(client, "user1@example.com", "User One")
    token2 = register_user(client, "user2@example.com", "User Two")

    me2 = client.get("/api/me", headers=auth_header(token2)).json()
    user2_id = me2["id"]

    r = client.post(
        "/api/pings",
        headers=auth_header(token1),
        json={
            "title": "After work",
            "location": "Local bar",
            "starts_at": "2030-01-01T18:00:00Z",
            "invitee_ids": [user2_id],
            "notes": "",
        },
    )

    assert r.status_code == 400
    body = r.json()
    assert "not your accepted friend" in body.get("detail", "")

