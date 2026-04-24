"""
Tests básicos para HU-01 (Empresas) y HU-02 (Usuarios).
Ejecutar con: pytest tests/ -v
"""
import pytest
import httpx

BASE_URL = "http://localhost:8000/api/v1"

# ──── HU-01: Empresas ────

@pytest.mark.asyncio
async def test_crear_empresa():
    """HU-01: Crear empresa con nombre, RUT y estado"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/empresas/", json={
            "nombre": "Test Empresa Pytest",
            "rut": "11.111.111-1"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["nombre"] == "Test Empresa Pytest"
        assert data["rut"] == "11.111.111-1"
        assert data["estado"] == True
        assert "id" in data

@pytest.mark.asyncio
async def test_rut_duplicado():
    """HU-01: RUT duplicado retorna error"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/empresas/", json={
            "nombre": "Duplicada", 
            "rut": "11.111.111-1"
        })
        assert resp.status_code == 400
        assert resp.json()["detail"] == "El RUT ya está registrado"

@pytest.mark.asyncio
async def test_listar_empresas():
    """HU-01: GET /empresas devuelve listado"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/empresas/")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

@pytest.mark.asyncio
async def test_editar_empresa():
    """HU-01: PUT /empresas/{id} actualiza datos"""
    async with httpx.AsyncClient() as client:
        # Obtener la empresa de test
        resp = await client.get(f"{BASE_URL}/empresas/")
        empresas = resp.json()
        test_emp = next((e for e in empresas if e["rut"] == "11.111.111-1"), None)
        assert test_emp is not None

        # Editar nombre
        resp = await client.put(f"{BASE_URL}/empresas/{test_emp['id']}", json={
            "nombre": "Test Empresa Editada"
        })
        assert resp.status_code == 200
        assert resp.json()["nombre"] == "Test Empresa Editada"

# ──── HU-02: Usuarios ────

@pytest.mark.asyncio
async def test_crear_usuario():
    """HU-02: Crear usuario con nombre, email, rol y empresa"""
    async with httpx.AsyncClient() as client:
        # Obtener empresa
        resp = await client.get(f"{BASE_URL}/empresas/")
        empresa_id = resp.json()[0]["id"]
        
        resp = await client.post(f"{BASE_URL}/usuarios/", json={
            "email": "test_pytest@test.cl",
            "nombre": "Test Pytest User",
            "password": "Test123!",
            "rol": "EMPLEADO",
            "client_id": empresa_id
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "test_pytest@test.cl"
        assert data["rol"] == "EMPLEADO"
        assert data["estado"] == True

@pytest.mark.asyncio
async def test_email_duplicado():
    """HU-02: Email duplicado retorna error"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/empresas/")
        empresa_id = resp.json()[0]["id"]
        
        resp = await client.post(f"{BASE_URL}/usuarios/", json={
            "email": "test_pytest@test.cl",
            "nombre": "Duplicado",
            "password": "Test123!",
            "rol": "EMPLEADO",
            "client_id": empresa_id
        })
        assert resp.status_code == 400
        assert resp.json()["detail"] == "El correo ya está registrado"

@pytest.mark.asyncio
async def test_editar_usuario_rol():
    """HU-02: PUT /usuarios/{id} cambia rol"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/empresas/")
        empresa_id = resp.json()[0]["id"]
        
        resp = await client.get(f"{BASE_URL}/usuarios/empresa/{empresa_id}")
        usuarios = resp.json()
        test_usr = next((u for u in usuarios if u["email"] == "test_pytest@test.cl"), None)
        assert test_usr is not None

        resp = await client.put(f"{BASE_URL}/usuarios/{test_usr['id']}", json={
            "rol": "RRHH"
        })
        assert resp.status_code == 200
        assert resp.json()["rol"] == "RRHH"

@pytest.mark.asyncio
async def test_desactivar_usuario():
    """HU-02: Desactivar usuario cambia estado a False"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/empresas/")
        empresa_id = resp.json()[0]["id"]
        
        resp = await client.get(f"{BASE_URL}/usuarios/empresa/{empresa_id}")
        usuarios = resp.json()
        test_usr = next((u for u in usuarios if u["email"] == "test_pytest@test.cl"), None)
        assert test_usr is not None

        resp = await client.put(f"{BASE_URL}/usuarios/{test_usr['id']}", json={
            "estado": False
        })
        assert resp.status_code == 200
        assert resp.json()["estado"] == False
