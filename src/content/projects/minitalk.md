---
title: "Minitalk"
description: "Programa de comunicación Cliente-Servidor utilizando únicamente señales UNIX (SIGUSR1 y SIGUSR2)."
pubDate: "2025-10-15"
tags: ["c", "unix", "signals", "42-school"]
link: "https://github.com/javiernglz/Minitalk"
icon: "/icons/terminal.png"
---

## Descripción
El objetivo de este proyecto es programar un pequeño sistema de intercambio de datos utilizando señales UNIX.

### Características
- Comunicación precisa entre cliente y servidor.
- Uso exclusivo de `SIGUSR1` y `SIGUSR2`.
- Capaz de transmitir cadenas de texto complejas y caracteres Unicode.
- Gestión estricta de memoria sin fugas (Leaks).

### Cómo funciona
El cliente convierte cada carácter del mensaje en binario y lo envía bit a bit usando señales al PID del servidor, que lo reconstruye en tiempo real.

```c
// Ejemplo conceptual
kill(server_pid, SIGUSR1); // Envía bit 0
kill(server_pid, SIGUSR2); // Envía bit 1