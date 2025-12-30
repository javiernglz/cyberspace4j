---
title: "Cazando un RCE con Splunk en 5 pasos"
description: "Guía rápida para investigar alertas de procesos inusuales en Apache. De los logs web a la confirmación del RCE en Sysmon."
pubDate: 2025-12-28
author: "Javier N. González"
categories: ['Blue Team']
tags: ["Apache", "blueteam", "splunk", "RCE"]
slug: "rce-splunk"

---

Hace poco investigué un incidente en una aplicación web sobre Windows. Los logs mostraban peticiones largas HTTP y trozos en Base64. **Spoiler: Era un intento de Ejecución Remota de Código (RCE).**

He resumido la investigación en una "Cheat Sheet" de 5 pasos para confirmar un ataque web usando Splunk. Vamos a ello.

### El Escenario
Un servidor Windows corriendo Apache. Una web pública con scripts antiguos (CGI) que no validan bien la entrada. El atacante intenta inyectar comandos del sistema a través de la URL.

---

### Paso 1: Detectar comandos web sospechosos (Access Logs)

Lo primero es ignorar el ruido, es decir, hay que filtrar bien. No busques tráfico HTTP sin más, porque saldrán ∞ resultados. Si alguien intenta inyectar comandos, dejará rastro en la *query string*.

**La consulta:**
```bash
index=windows_apache_access (cmd.exe OR powershell OR "Invoke-Expression") 
| table _time clientip uri_query status
```

**Lo que hay que buscar:**
* Peticiones con `status 200` (el servidor las procesó).
* En `uri_query`, busca strings raros. Si ves referencias a `cmd.exe` o bloques largos en Base64, tienes el primer indicio.

```text
_time                 clientip        uri_query                                     status
-------------------   -------------   -------------------------------------------   ------
2025-10-26 21:47:59   10.9.0.217      ?cmd=cmd.exe                                  200
2025-10-26 21:48:33   10.9.0.217      ?cmd=powershell.exe+-enc+VABoAGkAcwAg...      200
```
*Detecto tráfico aceptado (200 OK) apuntando a un script .bat con parámetros sospechosos.*

---

### Paso 2: A ver que me dicen los errores (Error Logs)

En inyecciones de código, un error 500 suele significar que el ataque **entró al backend**, el sistema operativo intentó ejecutarlo, pero falló la sintaxis. Es la confirmación de la vulnerabilidad.

**La consulta:**
```bash
index=windows_apache_error ("cmd.exe" OR "powershell" OR "Internal Server Error")
| table _time pid message
```

Si ves mensajes tipo `'powershell' is not recognized` o errores de sintaxis asociados a tus scripts, confirma que el input del usuario está tocando la consola de comandos.

```text
_time                 pid    message
-------------------   ----   -------------------------------------------------------------------------------------
2025-10-26 21:48:33   3716   [error] [client 10.9.0.217] 'powershell.exe' is not recognized as an internal or external command, operable program or batch file.
```
*El servidor intentó ejecutar el payload, pero falló. La vulnerabilidad está confirmada.*

---

### Paso 3: Comprobar la creación de procesos (Parent-Child Process)

Aquí es donde confirmamos el compromiso real. Un servidor web (`httpd.exe`) debería generar procesos hijos del propio servidor (workers), **nunca** una consola de comandos.
Un servidor web no necesita abrir la consola de comandos de Windows para mostrar una página web.

**La consulta:**
```bash
index=windows_sysmon ParentImage="*httpd.exe"
| table _time Computer ParentImage Image CommandLine
```

Si ves esta relación:
* **ParentImage:** `.../httpd.exe`
* **Image:** `.../cmd.exe`

Apache ha lanzado una terminal por orden del atacante.

```text
_time                 Computer       ParentImage                  Image                          CommandLine
-------------------   ------------   --------------------------   ----------------------------   -----------------------------------------------
2025-10-26 21:48:33   WebAppServer   C:\Apache24\bin\httpd.exe    C:\Windows\System32\cmd.exe    cmd.exe /c "C:\Apache24\cgi-bin\script.bat"
```
*Evidencia crítica: Apache ejecutando cmd.exe para lanzar el script vulnerable.*

---

### Paso 4: Confirmar la actividad de enumeración del atacante (Enumeración)

Una vez el atacante tiene shell, lo primero que hace es preguntar que usuario es. Busquemos esa fase de reconocimiento post-explotación.

**La consulta:**
```bash
index=windows_sysmon *cmd.exe* *whoami*
```

Si ves ejecuciones de `whoami`, `ipconfig` o `net user` bajo el usuario del servicio web (ej. `apache_svc`), el atacante está preparando el terreno para escalar privilegios.

```text
_time                 User                      Image                           CommandLine
-------------------   -----------------------   -----------------------------   -----------
2025-10-26 21:49:10   WEBAPPSERVER\apache_svc   C:\Apache24\cgi-bin\whoami.exe  whoami
```
*El atacante confirma sus privilegios ejecutando 'whoami'.*

---

### Paso 5: Identificar payloads de PowerShell codificadas en Base64

A veces, lo que no ves es igual de importante para el informe. En mi caso, vi intentos de PowerShell codificado en los logs web (Paso 1), pero necesitaba saber si llegaron a ejecutarse o si el AV los paró.

**La consulta:**
```bash
index=windows_sysmon Image="*powershell.exe" ("*enc*" OR "*Base64*")
```

Si esto devuelve **0 eventos**, significa que los payloads complejos fallaron y el atacante tuvo que recurrir a comandos más simples (`cmd.exe`) como vimos en el paso 3. Esto ayuda a definir el alcance real del incidente.

```text
No results found.
```

---

### Resumen

En cuestión de minutos, pasamos de una alerta cualquiera a confirmar:
1.  **Vector de entrada:** Script CGI vulnerable.
2.  **Ejecución exitosa:** Apache lanzando `cmd.exe`.
3.  **Impacto:** Enumeración de usuario confirmada.

Hasta aqui la "Cheat Sheet" de como pillar un RCE con Splunk.