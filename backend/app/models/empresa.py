from sqlalchemy import Column, String, Boolean
from .base import Base

class Empresa(Base):
    __tablename__ = "empresas"

    nombre = Column(String(255), nullable=False)
    rut = Column(String(20), unique=True, index=True, nullable=False)
    estado = Column(Boolean, default=True)
    domain = Column(String(100), unique=True, nullable=True) # Para identificar tenant por subdominio si aplica
    
    # client_id en este caso es el ID único de la empresa para el sistema SaaS
    # Aunque 'id' ya cumple esa función, mantuvimos el concepto de client_id para
    # consistencia con el estándar de Alloxentric en otras tablas vinculadas.
