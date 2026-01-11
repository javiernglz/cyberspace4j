---
title: "Inception"
description: "Infraestructura completa de servicios dockerizados: NGINX, MariaDB y WordPress corriendo en contenedores aislados."
pubDate: "2026-01-11"
tags: ["docker", "sysadmin", "virtualization", "42-school"]
link: "https://github.com/javiernglz/inception"
icon: "/icons/escudo.png"
---

## Descripción
Este proyecto consiste en levantar una infraestructura de pequeños servicios utilizando **Docker Compose**. El objetivo es entender la administración de sistemas y la virtualización mediante contenedores.

### Stack Tecnológico
- **NGINX** (TLS v1.2/v1.3) como punto de entrada seguro.
- **WordPress** + php-fpm.
- **MariaDB** como base de datos.
- Volúmenes persistentes para datos y archivos web.
- Red Docker interna para aislar los servicios.

### Despliegue
Todo el sistema se levanta con un solo comando gracias al `Makefile` personalizado:

```bash
make up
# Levanta los contenedores en modo detached