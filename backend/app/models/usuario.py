from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import MultiTenantBase

class Usuario(MultiTenantBase):
    __tablename__ = "usuarios"

    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False) # Temporal hasta HU-03 (Keycloak)
    rol = Column(String(50), nullable=False) # Roles: ADMIN, RRHH, EMPLEADO
    estado = Column(Boolean, default=True)
    
    # client_id viene de MultiTenantBase, pero además podemos hacer la relación explícita:
    empresa = relationship("Empresa", foreign_keys="Usuario.client_id", primaryjoin="Usuario.client_id == Empresa.id")
