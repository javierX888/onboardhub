import pytest
from httpx import AsyncClient
import asyncio
from app.main import app

@pytest.mark.asyncio
async def test_crear_template(test_client):
    payload = {
        "name": "Template Test 1",
        "description": "Template for testing",
        "client_id": 1,
        "tasks": [
            {
                "title": "Task 1",
                "type": "document",
                "description": "Desc 1",
                "order": 0
            },
            {
                "title": "Task 2",
                "type": "video",
                "description": "Desc 2",
                "order": 1
            }
        ]
    }
    
    response = await test_client.post("/api/v1/templates/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Template Test 1"
    assert len(data["tasks"]) == 2
    assert data["tasks"][0]["title"] == "Task 1"
    assert data["tasks"][1]["title"] == "Task 2"

@pytest.mark.asyncio
async def test_listar_templates(test_client):
    response = await test_client.get("/api/v1/templates/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Template Test 1"

@pytest.mark.asyncio
async def test_editar_template(test_client):
    # Get the first template
    response = await test_client.get("/api/v1/templates/")
    template_id = response.json()[0]["id"]
    
    payload_update = {
        "name": "Template Test 1 Edited",
        "description": "Edited",
        "tasks": [
            {
                "title": "Single Task",
                "type": "form",
                "description": "Others were removed, this one remains",
                "order": 0
            }
        ]
    }
    
    # Note: templates.py currently DOES NOT have a PUT endpoint!
    # I should add it.
    response = await test_client.put(f"/api/v1/templates/{template_id}", json=payload_update)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Template Test 1 Edited"

@pytest.mark.asyncio
async def test_eliminar_template(test_client):
    response = await test_client.get("/api/v1/templates/")
    template_id = response.json()[0]["id"]
    
    response = await test_client.delete(f"/api/v1/templates/{template_id}")
    assert response.status_code == 200 # Current templates.py returns 200 and the object
    
    # Verify it no longer exists
    # Wait,templates.py doesn't have a GET /{id} endpoint!
    # I'll just check if it's in the list
    response = await test_client.get("/api/v1/templates/")
    templates = response.json()
    assert not any(t["id"] == template_id for t in templates)

