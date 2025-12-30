---
title: 'Cómo escapar de un contenedor Docker'
description: 'Análisis de la vulnerabilidad de docker.sock expuesto.'
pubDate: '2025-12-24'
categories: ['Red Team']
tags: ['docker', 'pentesting', 'linux', 'privesc']
heroImage: '../../assets/img/docker_infografia.png'
slug: "docker-vuln"
---

Recientemente me encontré con un escenario que ilustra perfectamente uno de los riesgos más comunes en este tipo de entornos: la exposición innecesaria del socket de Docker.

Para entender cómo un simple error de configuración puede comprometer todo un servidor, primero debemos ver cómo funciona Docker por dentro. He preparado esta infografía para guiarnos durante el análisis.

<img src="../../assets/img/docker_infografia.png" alt="Esquema de la arquitectura Docker y la vulnerabilidad del socket expuesto" width="65%" style="display: block; margin-left: auto; margin-right: auto;">

## 1. Partes de Docker

Antes de pasar al ataque, miremos la infografía de arriba. Docker no es una sola pieza, son varios componentes que se comunican entre sí.

* **Docker Daemon:** En el centro del gráfico, con la corona. Es el proceso (`dockerd`) que se ejecuta en el servidor (Host). Es quien realmente hace las cosas: crea redes, monta discos y levanta procesos. Algo así como el cerebro con permisos Root de Docker.

* **Docker Cliente:** Arriba a la izquierda. Es la herramienta de línea de comandos (`docker run`, `docker ps`). Se encarga de enviar las órdenes al Daemon.

* **Socket:** Son las líneas negras (en la infografía) que conectan el Cliente con el Daemon. Es la API.
    * **Unix Socket (`/var/run/docker.sock`):** Es un archivo físico en el disco que actúa como canal de comunicación. Es la forma predeterminada de hablar con el Daemon localmente.
    * **TCP Socket (`:2375`):** Permite controlar Docker a través de la red (a menudo inseguro si no usa TLS).

* **Imágenes:** A la izquierda (iconos naranjas). Son plantillas estáticas y de solo lectura (como un ISO de Ubuntu o Nginx). Son algo así como un plano con instrucciones.

* **Contenedores:** A la derecha, en azul. Es lo que ocurre cuando el Daemon coge una Imagen y la pone a funcionar. Son entornos aislados.

## 2. En la práctica: el objetivo es el Contenedor B

Durante el pentesting, conseguí acceso a uno de estos contenedores (marcado en la imagen como **"Contenedor B / Compromised"**).

Tener acceso a un contenedor no es grave por sí mismo; se supone que es una cárcel aislada. Sin embargo, al enumerar los archivos internos, encontré algo que no debía estar allí:

```bash
ls -la /var/run/docker.sock
```

El administrador había cometido el error de **montar el Unix Socket dentro del contenedor**. Básicamente, había metido el "cable" de administración dentro de la celda de la prisión.

## 3. El Ataque: Abuso de la vulnerabilidad del Socket

Fijaos en la **línea discontinua roja** de la infografía. Ese es el camino que he descubierto gracias al comando anterior.

Al tener acceso al archivo `.sock`, mi usuario dentro del contenedor (aunque no sea root en el host) puede enviar instrucciones directamente al Daemon (que SÍ es root en el host).

Para confirmar que tenemos línea directa con Daemon, lanzamos un comando desde dentro del contenedor hackeado:

```bash
docker ps
```

Si el comando responde listando todos los contenedores de la infraestructura, confirmamos que he roto la capa de aislamiento.

El objetivo ahora es hacer pivoting para llegar a la base de datos o a un contenedor de gestión con credenciales. En la imagen, queremos saltar al **Contenedor A**.

Como controlamos al Daemon, podemos pedirle que nos ejecute una shell en el otro contenedor:

```bash
docker exec -it contenedor_A bash
```

## 4. Conclusión

Al ejecutar ese comando, hemos convertido una vulnerabilidad en un contenedor aislado en un **movimiento lateral** exitoso. Si hubiese querido ser más destructivo, podríamos haber montado la raíz del disco duro del servidor en un contenedor nuevo, tomando control total del sistema operativo anfitrión.

### ¿Cómo evitar esto?
Mirando la infografía, la solución es obvia: **Arreglar la línea roja**.

Por lo que nunca hay que montar `/var/run/docker.sock` en un contenedor a menos que sea estrictamente necesario. Si necesitas que un contenedor vea a otros, utiliza un **Proxy de Socket** de solo lectura o configura una API segura con autenticación TLS.