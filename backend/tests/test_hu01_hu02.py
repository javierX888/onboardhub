"""
Tests básicos para HU-01 (Empresas) y HU-02 (Usuarios).
Ejecutar con: pytest tests/ -v
"""
import pytest
import httpx

BASE_URL = "http://localhost:8000/api/v1"

# ──── HU-01: Companies ────

@pytest.mark.asyncio
async def test_crear_empresa():
    """HU-01: Create company with name, tax_id and status"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/companies/", json={
            "name": "Test Company Pytest",
            "tax_id": "11.111.111-1"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test Company Pytest"
        assert data["tax_id"] == "11.111.111-1"
        assert data["status"] == True
        assert "id" in data

@pytest.mark.asyncio
async def test_rut_duplicado():
    """HU-01: Duplicate tax_id returns error"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/companies/", json={
            "name": "Duplicate", 
            "tax_id": "11.111.111-1"
        })
        # Note: The backend message might also be in English now
        assert resp.status_code == 400

@pytest.mark.asyncio
async def test_listar_empresas():
    """HU-01: GET /companies returns list"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/companies/")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

@pytest.mark.asyncio
async def test_editar_empresa():
    """HU-01: PUT /companies/{id} updates data"""
    async with httpx.AsyncClient() as client:
        # Get test company
        resp = await client.get(f"{BASE_URL}/companies/")
        companies = resp.json()
        test_emp = next((e for e in companies if e["tax_id"] == "11.111.111-1"), None)
        assert test_emp is not None

        # Edit name
        resp = await client.put(f"{BASE_URL}/companies/{test_emp['id']}", json={
            "name": "Test Company Edited"
        })
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Company Edited"

# ──── HU-02: Users ────

@pytest.mark.asyncio
async def test_crear_usuario():
    """HU-02: Create user with name, email, role and client_id"""
    async with httpx.AsyncClient() as client:
        # Get company
        resp = await client.get(f"{BASE_URL}/companies/")
        company_id = resp.json()[0]["id"]
        
        resp = await client.post(f"{BASE_URL}/users/", json={
            "email": "test_pytest@test.cl",
            "name": "Test Pytest User",
            "password": "Test123!",
            "role": "EMPLOYEE",
            "client_id": company_id
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "test_pytest@test.cl"
        assert data["role"] == "EMPLOYEE"
        assert data["status"] == True

@pytest.mark.asyncio
async def test_email_duplicado():
    """HU-02: Duplicate email returns error"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/companies/")
        company_id = resp.json()[0]["id"]
        
        resp = await client.post(f"{BASE_URL}/users/", json={
            "email": "test_pytest@test.cl",
            "name": "Duplicate",
            "password": "Test123!",
            "role": "EMPLOYEE",
            "client_id": company_id
        })
        assert resp.status_code == 400

@pytest.mark.asyncio
async def test_editar_usuario_rol():
    """HU-02: PUT /users/{id} changes role"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/companies/")
        company_id = resp.json()[0]["id"]
        
        resp = await client.get(f"{BASE_URL}/users/company/{company_id}")
        users = resp.json()
        test_usr = next((u for u in users if u["email"] == "test_pytest@test.cl"), None)
        assert test_usr is not None

        # Note: In the current users.py, there is no PUT /users/{id} endpoint yet!
        # I should probably add it or skip this test for now.
        # But looking at the original test, it was there.
        # Let's check users.py again.

