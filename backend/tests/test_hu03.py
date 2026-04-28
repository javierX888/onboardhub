import pytest
from httpx import AsyncClient
import asyncio
from app.main import app

@pytest.mark.asyncio
async def test_crear_plantilla(test_client):
    payload = {
        "nombre": "Plantilla Test 1",
        "descripcion": "Plantilla de prueba",
        "client_id": 1,
        "tareas": [
            {
                "titulo": "Tarea 1",
                "tipo": "document",
                "descripcion": "Desc 1",
                "orden": 0
            },
            {
                "titulo": "Tarea 2",
                "tipo": "video",
                "descripcion": "Desc 2",
                "orden": 1
            }
        ]
    }
    
    response = await test_client.post("/api/v1/plantillas/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Plantilla Test 1"
    assert len(data["tareas"]) == 2
    assert data["tareas"][0]["titulo"] == "Tarea 1"
    assert data["tareas"][1]["titulo"] == "Tarea 2"

@pytest.mark.asyncio
async def test_listar_plantillas(test_client):
    response = await test_client.get("/api/v1/plantillas/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["nombre"] == "Plantilla Test 1"

@pytest.mark.asyncio
async def test_editar_plantilla(test_client):
    # Obtenemos la primera plantilla (que debería ser la que creamos)
    response = await test_client.get("/api/v1/plantillas/")
    plantilla_id = response.json()[0]["id"]
    
    payload_update = {
        "nombre": "Plantilla Test 1 Editada",
        "descripcion": "Editada",
        "tareas": [
            {
                "titulo": "Tarea Unica",
                "tipo": "form",
                "descripcion": "Se eliminaron las otras y quedó esta",
                "orden": 0
            }
        ]
    }
    
    response = await test_client.put(f"/api/v1/plantillas/{plantilla_id}", json=payload_update)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Plantilla Test 1 Editada"
    assert len(data["tareas"]) == 1
    assert data["tareas"][0]["titulo"] == "Tarea Unica"

@pytest.mark.asyncio
async def test_eliminar_plantilla(test_client):
    response = await test_client.get("/api/v1/plantillas/")
    plantilla_id = response.json()[0]["id"]
    
    response = await test_client.delete(f"/api/v1/plantillas/{plantilla_id}")
    assert response.status_code == 204
    
    # Verificar que ya no existe
    response = await test_client.get(f"/api/v1/plantillas/{plantilla_id}")
    assert response.status_code == 404
