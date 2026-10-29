const API = "https://proyect-data-xix-api.onrender.com";

const inputPais = document.getElementById("pais");
const sugerenciasPais = document.getElementById("sugerenciasPais");
const botonConsultar = document.getElementById("consultar");
const resultado = document.getElementById("resultado");
const cuerpoTabla = document.getElementById("cuerpoTabla");

let paises = [];
let grafico;


// Obtener los países desde la API
async function cargarPaises() {
    try {
        const respuesta = await fetch(`${API}/api/paises`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los países.");
        }

        paises = await respuesta.json();

    } catch (error) {
        console.error("Error al cargar los países:", error);
        resultado.textContent =
            "No se pudieron cargar los países. Verifique que el servidor esté funcionando.";
    }
}

// --------------------------------------------------
// NORMALIZAR TEXTO
// Permite ignorar mayúsculas y acentos
// --------------------------------------------------

function normalizar(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}


// --------------------------------------------------
// MOSTRAR PAÍSES
// --------------------------------------------------

function mostrarPaises(lista) {

    sugerenciasPais.innerHTML = "";

    lista.forEach(pais => {

        const opcion = document.createElement("button");

        opcion.type = "button";
        opcion.textContent = pais;

        opcion.addEventListener("click", () => {

            inputPais.value = pais;

            sugerenciasPais.innerHTML = "";
        });

        sugerenciasPais.appendChild(opcion);
    });
}


// --------------------------------------------------
// AL HACER CLICK EN EL CAMPO
// MOSTRAR TODOS LOS PAÍSES
// --------------------------------------------------

inputPais.addEventListener("focus", () => {

    const texto = normalizar(inputPais.value.trim());

    // Si el campo está vacío, mostrar todos
    if (texto === "") {

        mostrarPaises(paises);

    } else {

        // Si ya hay texto, mostrar las coincidencias
        const coincidencias = paises.filter(pais =>
            normalizar(pais).includes(texto)
        );

        mostrarPaises(coincidencias);
    }
});


// --------------------------------------------------
// FILTRAR MIENTRAS SE ESCRIBE
// --------------------------------------------------

inputPais.addEventListener("input", () => {

    const texto = normalizar(inputPais.value.trim());

    // Si se borró todo, mostrar nuevamente todos
    if (texto === "") {

        mostrarPaises(paises);

        return;
    }

    // Buscar coincidencias
    const coincidencias = paises.filter(pais =>
        normalizar(pais).includes(texto)
    );

    mostrarPaises(coincidencias);
});


// --------------------------------------------------
// OCULTAR LA LISTA AL HACER CLICK AFUERA
// --------------------------------------------------

document.addEventListener("click", (evento) => {

    if (!evento.target.closest(".buscador-pais")) {

        sugerenciasPais.innerHTML = "";
    }
});


// Consultar los datos
async function consultarDatos() {

    const textoPais = inputPais.value.trim();

    // Buscar el país real dentro de la lista
    const pais = paises.find(p =>
        normalizar(p) === normalizar(textoPais)
    );

    if (!pais) {

        resultado.textContent = "Seleccione un país válido.";

        return;
    }

    const añoInicio = document.getElementById("añoInicio").value;
    const añoFin = document.getElementById("añoFin").value;
    
    const inicio = Number(añoInicio);
    const fin = Number(añoFin);

    if (
        añoInicio === "" ||
        añoFin === "" ||
        !Number.isInteger(inicio) ||
        !Number.isInteger(fin) ||
        inicio < 2000 ||
        inicio > 2025 ||
        fin < 2000 ||
        fin > 2025 ||
        inicio > fin
    ) {
        resultado.textContent =
            "Ingrese años válidos entre 2000 y 2025.";

        return;
    }

    const url =
        `${API}/api/pais/años` +
        `?pais=${encodeURIComponent(pais)}` +
        `&año_inicio=${añoInicio}` +
        `&año_fin=${añoFin}`;


    let datos;

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("Error al consultar los datos.");
        }

        datos = await respuesta.json();

    } catch (error) {
        console.error("Error al consultar la API:", error);

        resultado.textContent =
            "No se pudieron consultar los datos. Verifique la conexión con el servidor.";

        cuerpoTabla.innerHTML = "";

        if (grafico) {
            grafico.destroy();
            grafico = null;
        }

        return;
    }

    if (datos.length === 0) {
        resultado.textContent =
            "No se encontraron datos para el país y el período seleccionados.";

        cuerpoTabla.innerHTML = "";

        if (grafico) {
            grafico.destroy();
            grafico = null;
        }

        return;
    }

    console.log(datos);


    // Mostrar cantidad de registros
    resultado.textContent =
        `Se encontraron ${datos.length} registros.`;


    // Limpiar tabla
    cuerpoTabla.innerHTML = "";

    const formatoNumero = new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
    });

    // Crear filas
    datos.forEach(registro => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${registro.pais}</td>
            <td>${registro.año}</td>
            <td>${registro.indicador}</td>
            <td>${formatoNumero.format(registro.valor)}</td>
        `;

        cuerpoTabla.appendChild(fila);
    });


    // --------------------------------------------------
    // GRÁFICO
    // --------------------------------------------------

    const años = datos.map(registro => registro.año);
    const valores = datos.map(registro => registro.valor);


    if (grafico) {

        grafico.destroy();
    }


    const contexto = document.getElementById("grafico");


    grafico = new Chart(contexto, {

        type: "line",

        data: {

            labels: años,

            datasets: [{

                label: `PIB per capita de ${pais}`,

                data: valores
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            plugins: {
                title: {
                    display: true,
                    text: `Evolución del PIB per cápita de ${pais}`,
                    font: {
                        size: 18
                    },
                    padding: 20
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "PIB per cápita: " +
                                new Intl.NumberFormat("es-CR", {
                                    style: "decimal",
                                    maximumFractionDigits: 1
                                }).format(context.parsed.y);
                        }
                    }
                }
            },

            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Año"
                    }
                },

                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: "PIB per cápita"
                    },

                    ticks: {
                        callback: function(valor) {
                            return new Intl.NumberFormat("es-CR", {
                                notation: "compact",
                                maximumFractionDigits: 1
                            }).format(valor);
                        }
                    }
                }
            }
        }
    });
}


// Eventos
botonConsultar.addEventListener("click", consultarDatos);


// Cargar países al abrir la página
cargarPaises();