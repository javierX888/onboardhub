import sys
import os

# Añadir la carpeta backend al path para que Python encuentre los módulos
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_mock_engine
from app.models.base import Base
# Importar todos los modelos para que Base.metadata los reconozca
from app.models.company import Company
from app.models.user import User
from app.models.template import Template, TemplateTask
from app.models.journey import Journey, JourneyTask

# Función para interceptar las consultas SQL y guardarlas en un archivo
with open('modelo_datos.sql', 'w', encoding='utf-8') as f:
    f.write("-- ==========================================\n")
    f.write("-- SCRIPT DE CREACIÓN DE BASE DE DATOS (DDL)\n")
    f.write("-- Sistema: OnBoardHub (SaaS Multi-tenant)\n")
    f.write("-- Motor: PostgreSQL\n")
    f.write("-- ==========================================\n\n")

    def dump_to_file(sql, *multiparams, **params):
        # Convertir a string, limpiar espacios extra y añadir punto y coma
        statement = str(sql.compile(dialect=engine.dialect)).strip()
        if statement:
            f.write(statement + ";\n\n")

    # Motor simulado (Mock Engine) que no se conecta a la BD real, solo genera el SQL
    engine = create_mock_engine('postgresql://', dump_to_file)
    
    # Generar todos los CREATE TABLE
    Base.metadata.create_all(engine, checkfirst=False)

print("✅ Archivo 'modelo_datos.sql' generado exitosamente en la raíz del proyecto.")
