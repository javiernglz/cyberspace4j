---
title: "Compras sin Stock: Explotando Race Conditions con Burp Suite"
description: "Las fases para detectar y explotar vulnerabilidades de Condición de Carrera (TOCTOU) en compras utilizando la paralelización de peticiones."
pubDate: 2025-12-30
author: "Javier N. González"
categories: ['Red Team']
tags: ["Web Exploitation", "Burp Suite", "OWASP"]
slug: "race-conditions-burp-suite"
---

Las vulnerabilidades lógicas suelen ser las más peligrosas porque no dependen de un fallo en el código, sino de un fallo en el diseño del proceso. Hoy vamos a analizar una de las más clásicas en entornos de compras online: la **Condición de Carrera** (Race Condition), específicamente del tipo *Time-of-Check to Time-of-Use* (TOCTOU).

El escenario es simple, tenemos en frente un producto con stock limitado (digamos, 1 unidad). ¿Qué pasa si intentamos comprarlo 15 veces en el mismo milisegundo? Si la base de datos no maneja la concurrencia correctamente, conseguiremos comprar artículos que no existen.

A continuación, divido en fases el procedimiento técnico para replicar y auditar este fallo utilizando **Burp Suite**.

---

Una Race Condition ocurre cuando la aplicación procesa múltiples hilos (threads) simultáneamente que compiten por el mismo recurso.

1.  **Check:** El sistema mira si hay stock (Stock = 1).
2.  **Delay:** Pasan unos milisegundos mientras se procesa el pago.
3.  **Use:** El sistema resta el stock y confirma la orden.

Si logramos meter 10 peticiones entre el paso 1 y el 3, todas leerán "Stock = 1" antes de que la primera petición logre actualizarlo a "0".

---

## Fase 1: Intercepción y Análisis

Lo primero es configurar Burp Suite para que no bloquee el tráfico mientras navegamos. Nos aseguramos de que en la pestaña **Proxy Intercept** el botón principal está desactivado (Intercept is off) para poder realizar la compra normal en el navegador. Navegamos por la aplicación de forma legítima hasta el momento final de la compra,es decir, hasta el botón de pagar o confirmar pedido.

![Burp Suite con el Proxy Intercept desactivado](../../assets/img/1-burp-intercept-off.png)

Acto seguido, activamos el **Proxy Intercept** en Burp Suite y vamos a la pestaña **HTTP history** para encontrar la petición POST encargada de finalizar la transacción.

> **Nota:** Buscamos parámetros que indiquen una transacción de estado, como `/checkout`, `/finalize` o `/buy` (en este caso, checkout es la palabra clave).

![Historial de peticiones en Burp Suite mostrando el endpoint checkout](../../assets/img/2-burp-history.png)

---

## Fase 2: Repeater

Una vez identificada la petición, no la enviamos todavía. La mandamos al **Repeater** (`Ctrl + R`).

Para explotar una Race Condition, nuestros clicks por muy rápido que sean, no nos funcionan. Necesitamos paralelismo. En Burp Suite, utilizamos la funcionalidad de **Tab Groups** (Grupos de pestañas).

1.  Enviamos la petición al Repeater.
2.  Hacemos clic derecho en la pestaña -> **Add tab to group** -> **Create tab group**.
3.  Duplicamos la petición dentro del grupo (Click derecho -> **Duplicate tab**) e introducimos, por ejemplo, unas 15.

El objetivo es tener una batería de peticiones idénticas listas para ser lanzadas.

![Grupo de pestañas en Repeater preparadas para el ataque](../../assets/img/3-burp-repeater-group.png)
---

## Fase 3: Configuración del Ataque (Parallel Send)

Paso importante. Si enviamos las peticiones una por una ("Send"), el servidor las procesará secuencialmente y nos bloqueará en la segunda.

Necesitamos que salgan a la vez.

1.  Abrimos el desplegable junto al botón de envío.
2.  Seleccionamos la opción **Send group in parallel (last-byte sync)**.

Esta opción utiliza una técnica de sincronización de último byte: Burp envía el 99% de cada petición y las deja esperando. Cuando todas están listas, suelta el último byte de todas simultáneamente, maximizando la probabilidad de que lleguen al servidor en el mismo instante.

![Configuración de envío paralelo en Burp Suite](../../assets/img/4-burp-parallel-config.png)
---

## Fase 4: Ejecución y Verificación

Con la configuración lista, pulsamos el botón **Send group (parallel)**.

Veremos cómo todas las pestañas se actualizan casi al mismo tiempo. Para verificar el éxito del ataque, revisamos los códigos de estado HTTP en el historial o en las pestañas del Repeater.

Nos saldrán múltiples respuestas `200 OK` dando el visto bueno a la compra.

* Si el stock inicial era 1 y logramos 5 confirmaciones de éxito, la vulnerabilidad está confirmada.
* En el backend, esto suele resultar en un stock negativo (ej. -4).

---

## Solución y Remediación

Para mitigar esta vulnerabilidad, los desarrolladores deben implementar:

1.  Asegurar que la lectura y la escritura del stock sean una operación indivisible.
2.  Usar sentencias como `SELECT ... FOR UPDATE` para bloquear la fila del producto hasta que la transacción termine.

---

> **Disclaimer:** *Esta información se comparte con fines puramente educativos y profesionales para ayudar a desarrolladores y analistas a asegurar sus sistemas. Las pruebas mostradas se han realizado en un entorno de laboratorio controlado.*