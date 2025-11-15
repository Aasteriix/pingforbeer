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


def make_friends(client, token1, token2):
    me1 = client.get("/api/me", headers=auth_header(token1)).json()
    me2 = client.get("/api/me", headers=auth_header(token2)).json()
    user1_id = me1["id"]
    user2_id = me2["id"]

    r = client.post(f"/api/friends/{user2_id}/request", headers=auth_header(token1))
    assert r.status_code == 200

    r = client.post(f"/api/friends/{user1_id}/approve", headers=auth_header(token2))
    assert r.status_code == 200

    return user1_id, user2_id


def test_unfriend_removes_friendship_both_ways(client):
    token1 = register_user(client, "user1@example.com", "User One")
    token2 = register_user(client, "user2@example.com", "User Two")

    user1_id, user2_id = make_friends(client, token1, token2)

    r = client.get("/api/friends", headers=auth_header(token1))
    friends1 = r.json()
    assert len(friends1) == 1
    assert friends1[0]["id"] == user2_id

    r = client.get("/api/friends", headers=auth_header(token2))
    friends2 = r.json()
    assert len(friends2) == 1
    assert friends2[0]["id"] == user1_id

    r = client.delete(f"/api/friends/{user2_id}", headers=auth_header(token1))
    assert r.status_code == 204

    r = client.get("/api/friends", headers=auth_header(token1))
    assert r.status_code == 200
    assert r.json() == []

    r = client.get("/api/friends", headers=auth_header(token2))
    assert r.status_code == 200
    assert r.json() == []
