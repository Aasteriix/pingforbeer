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


def test_users_search_excludes_self_and_matches_name_email(client):
    token_me = register_user(client, "me@example.com", "Astrid")
    token_other1 = register_user(client, "friend1@example.com", "Bestie One")
    token_other2 = register_user(client, "friend2@example.com", "Bestie Two")

    me = client.get("/api/me", headers=auth_header(token_me)).json()
    my_id = me["id"]

    r = client.get(
        "/api/users/search",
        headers=auth_header(token_me),
        params={"q": "Bestie"},
    )
    assert r.status_code == 200
    res = r.json()

    ids = {u["id"] for u in res}
    names = {u["name"] for u in res}

    assert my_id not in ids
    assert "Bestie One" in names
    assert "Bestie Two" in names
    assert len(res) == 2
