import pandas as pd
from fastapi import FastAPI
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RUTA_CSV = BASE_DIR.parent / "data" / "datos_economicos.csv"

# Leer los datos
datos = pd.read_csv(
    RUTA_CSV,
    skiprows=1,
    sep="\t",
    names=["pais", "año", "indicador", "valor"]
)

# Crear la aplicación
app = FastAPI()

# Página principal de prueba
@app.get("/")
def inicio():
    return {"mensaje": "API de datos económicos funcionando"}


# Obtener todos los países
@app.get("/api/paises")
def obtener_paises():
    paises = datos["pais"].unique().tolist()
    return paises

# Obtener los datos de un país por rango de años
@app.get("/api/pais/años")
def obtener_datos_por_años(pais: str, año_inicio: int, año_fin: int):

    resultado = datos[
        (datos["pais"] == pais) &
        (datos["año"] >= año_inicio) &
        (datos["año"] <= año_fin)
    ]

    return resultado.to_dict(orient="records")

# Obtener los datos de un país
@app.get("/api/pais/{pais}")
def obtener_datos_pais(pais: str):
    resultado = datos[datos["pais"] == pais]

    return resultado.to_dict(orient="records")
